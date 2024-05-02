import { Context } from "hono";
import sharp from "sharp";

const resize = async (c: Context) => {
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
};

const rotate = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const rotateDegree = parseInt(body["rotateDegree"] as string);

  if (isNaN(rotateDegree)) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "rotation degree must be a decimal number",
    });
  }

  try {
    const buffer = await file.arrayBuffer();
    const image = sharp(new Uint8Array(buffer));

    await image
      .rotate(rotateDegree)
      .toFile(`uploads/image/rotated-${file.name}`);

    return c.json({
      message: "success",
      image: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/image/rotated-${file.name}`,
      },
    });
  } catch (error) {
    c.status(500);
    return c.json({
      message: "internal server error",
      error: "error processing image",
    });
  }
};

const flip = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const flipDirection = body["flipDirection"] as string;

  try {
    const buffer = await file.arrayBuffer();
    const image = sharp(new Uint8Array(buffer));

    if (flipDirection === "H") {
      image.flop();
    } else if (flipDirection === "V") {
      image.flip();
    } else {
      c.status(400);
      return c.json({
        message: "validation error",
        error: "flipDirection must be either H or V",
      });
    }

    await image.toFile(`uploads/image/flipped-${file.name}`);

    return c.json({
      message: "success",
      image: {
        name: file.name,
        size: file.size,
        url: `${process.env.HOST}/uploads/image/flipped-${file.name}`,
      },
    });
  } catch (error) {
    c.status(500);
    return c.json({
      message: "internal server error",
      error: "error processing image",
    });
  }
};

export default { resize, rotate, flip };
