import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { timeout } from "hono/timeout";
import imageHandler from "./handler/imageHandler";
import audioHandler from "./handler/audioHandler";
import videoHandler from "./handler/videoHandler";

const app = new Hono();

app.use(cors());
app.use(logger());
app.use("/api/*", serveStatic({ root: "./" }));

app.post("/api/image/resize", imageHandler.resize);
app.post("/api/image/rotate", imageHandler.rotate);
app.post("/api/image/flip", imageHandler.flip);

app.use(timeout(800000));

app.post("/api/audio/compress", audioHandler.compress);
app.post("/api/video/compress", videoHandler.compress);

export default app;
