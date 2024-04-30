import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { unlink } from "node:fs/promises";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

const app = new Hono();

app.use(cors());
app.use(logger());
app.use("/uploads/*", serveStatic({ root: "./" }));

app.post("/image/resize", async (c) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const width = parseInt(body["width"] as string);
  const height = parseInt(body["height"] as string);

  if (file.type.split("/")[0] != "image") {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "file must be an image",
    });
  }

  if (isNaN(height) || isNaN(width)) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "height or width must be a decimal number",
    });
  }

  if (height < 1 || width < 1) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "height or width must be greater than 0",
    });
  }

  try {
    const buffer = await file.arrayBuffer();
    const image = sharp(new Uint8Array(buffer));
    await image
      .resize(width, height)
      .toFile(`uploads/image/resized-${file.name}`);

    return c.json({
      message: "success",
      image: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/image/resized-${file.name}`,
      },
    });
  } catch (error) {
    c.status(500);
    return c.json({
      message: "internal server error",
      error: "error processing image",
    });
  }
});

app.post("/audio/compress", async (c) => {
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
});

export default app;
