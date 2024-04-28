import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { Readable } from "stream";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

const app = new Hono();

app.use("/uploads/*", serveStatic({ root: "./" }));

app.post("/image/upload", async (c) => {
  const body = await c.req.parseBody();
  const width = parseInt(body["width"] as string);
  const height = parseInt(body["height"] as string);
  const file = body["image"] as Blob;

  if (file.type.split("/")[0] != "image") {
    return c.text("file must be an image");
  }

  if (isNaN(height) || isNaN(width)) {
    return c.text("width or height must be a decimal number");
  }

  try {
    const buffer = await file.arrayBuffer();
    const image = sharp(new Uint8Array(buffer));
    await image.resize(width, height).toFile(`uploads/image/${file.name}`);

    return c.json({
      message: "image uploaded",
      image: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/image/${file.name}`,
      },
    });
  } catch (error) {
    return c.text("error processing image");
  }
});

app.post("/audio/upload", async (c) => {
  const body = await c.req.parseBody();
  const level = body["level"] as string;
  const file = body["audio"] as Blob;
  const fileType = file.type.split("/");

  if (fileType[0] != "audio" || fileType[1] != "mpeg") {
    return c.text("file must be an audio/mpeg");
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

    return c.json({
      message: "audio uploaded",
      audio: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/audio/compressed-${file.name}`,
      },
    });
  } catch (error) {
    return c.text("error processing audio");
  }
});

export default app;
