import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/image/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;

  if (file.type.split("/")[0] != "image") {
    return c.text("File not allowed");
  }

  return c.json({
    message: "Image uploaded",
    image: { name: file.name, size: file.size },
  });
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
