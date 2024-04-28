import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import sharp from "sharp";
// import ffmpeg from "fluent-ffmpeg";

const app = new Hono();

app.use("/uploads/*", serveStatic({ root: "./" }));

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/image/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const width = parseInt(body["width"] as string);
  const height = parseInt(body["height"] as string);

  if (file.type.split("/")[0] != "image") {
    return c.text("file must be an image");
  }

  if (isNaN(height) || isNaN(width)) {
    return c.text("width or height must be a decimal number");
  }

  try {
    const buffer = await file.arrayBuffer();
    const image = sharp(new Uint8Array(buffer));
    const processedImage = await image
      .resize(width, height)
      .toFile(`uploads/image/${file.name}`);

    return c.json({
      message: "Image uploaded",
      image: {
        name: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    return c.text("Error processing image");
  }
});

app.post("/audio/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["audio"] as Blob;

  if (file.type.split("/")[0] != "audio") {
    return c.text("File not allowed");
  }

  return c.json({
    message: "Audio uploaded",
    image: { name: file.name, size: file.size },
  });
});

export default app;
