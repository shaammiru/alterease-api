import { unlink } from "node:fs/promises";
import { Context } from "hono";
import ffmpeg from "fluent-ffmpeg";
import BlobStorage from "../service/blobStorage";

const compress = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["video"] as Blob;
  const level = body["level"] as string;

  if (!file) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "video field is required",
    });
  }

  if (file.type != "video/mp4" && file.type != "video/mpeg") {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "file must be a video/mp4 or video/mpeg",
    });
  }

  var bitrate = "500k";
  switch (level) {
    case "low":
      bitrate = "500k";
      break;
    case "medium":
      bitrate = "300k";
      break;
    case "high":
      bitrate = "150k";
      break;
  }

  try {
    await Bun.write(`api/video/${file.name}`, file);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(`api/video/${file.name}`)
        .videoBitrate(bitrate)
        .output(`api/video/compressed-${file.name}`)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });

    const compressedFile = Bun.file(`api/video/compressed-${file.name}`);
    const compressedFileBuffer = Buffer.from(
      await compressedFile.arrayBuffer()
    );
    const fileUrl = await BlobStorage.uploadFile(
      compressedFileBuffer,
      `compressed-${file.name}`,
      "video"
    );

    await unlink(`api/video/${file.name}`);

    return c.json({
      message: "success",
      video: {
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
