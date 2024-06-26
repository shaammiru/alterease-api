import { unlink } from "node:fs/promises";
import { Context } from "hono";
import ffmpeg from "fluent-ffmpeg";
import BlobStorage from "../service/blobStorage";

const compress = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["audio"] as Blob;
  const level = body["level"] as string;

  if (!file) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "audio field is required",
    });
  }

  if (file.type != "audio/mpeg") {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "file must be an audio/mpeg",
    });
  }

  var bitrate = "96k";
  switch (level) {
    case "low":
      bitrate = "96k";
      break;
    case "medium":
      bitrate = "64k";
      break;
    case "high":
      bitrate = "48k";
      break;
  }

  try {
    await Bun.write(`api/audio/${file.name}`, file);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(`api/audio/${file.name}`)
        .audioBitrate(bitrate)
        .output(`api/audio/compressed-${file.name}`)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });

    const compressedFile = Bun.file(`api/audio/compressed-${file.name}`);
    const compressedFileBuffer = Buffer.from(
      await compressedFile.arrayBuffer()
    );
    const fileUrl = await BlobStorage.uploadFile(
      compressedFileBuffer,
      file.name,
      "audio"
    );

    await unlink(`api/audio/${file.name}`);

    return c.json({
      message: "success",
      audio: {
        name: file.name,
        size: file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({
      message: "internal server error",
      error: "error processing audio",
    });
  }
};

export default {
  compress,
};
