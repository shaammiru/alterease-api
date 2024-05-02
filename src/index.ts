import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import imageHandler from "./handler/imageHandler";
import audioHandler from "./handler/audioHandler";

const app = new Hono();

app.use(cors());
app.use(logger());
app.use("/uploads/*", serveStatic({ root: "./" }));

app.get("/", async (c) => {
  return c.text("Welcome to Hono!");
});
app.post("/image/resize", imageHandler.resize);
app.post("/image/rotate", imageHandler.rotate);
app.post("/image/flip", imageHandler.flip);
app.post("/audio/compress", audioHandler.compress);

export default app;
