import { unlink } from "node:fs/promises";
import { Context } from "hono";
import ffmpeg from "fluent-ffmpeg";

const compress = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["audio"] as Blob;
  const level = body["level"] as string;

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
    await Bun.write(`uploads/audio/${file.name}`, file);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(`uploads/audio/${file.name}`)
        .audioBitrate(bitrate)
        .output(`uploads/audio/compressed-${file.name}`)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });

    await unlink(`uploads/audio/${file.name}`);

    return c.json({
      message: "success",
      audio: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/audio/compressed-${file.name}`,
      },
    });
  } catch (error) {
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
