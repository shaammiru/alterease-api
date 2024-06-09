import { Context } from "hono";
import sharp from "sharp";
import BlobStorage from "../service/blobStorage";

const resize = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const width = parseInt(body["width"] as string);
  const height = parseInt(body["height"] as string);

  if (!file) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "image field is required",
    });
  }

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
    const processedImage = await image.resize(width, height).toBuffer();
    const fileUrl = await BlobStorage.uploadFile(
      processedImage,
      file.name,
      "image"
    );

    return c.json({
      message: "success",
      image: {
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
      error: "error processing image",
    });
  }
};

const rotate = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const rotateDegree = parseInt(body["rotateDegree"] as string);

  if (!file) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "image field is required",
    });
  }

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
    const processedImage = await image.rotate(rotateDegree).toBuffer();
    const fileUrl = await BlobStorage.uploadFile(
      processedImage,
      file.name,
      "image"
    );

    return c.json({
      message: "success",
      image: {
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
      error: "error processing image",
    });
  }
};

const flip = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body["image"] as Blob;
  const flipDirection = body["flipDirection"] as string;

  if (!file) {
    c.status(400);
    return c.json({
      message: "validation error",
      error: "image field is required",
    });
  }

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

    const processedImage = await image.toBuffer();
    const fileUrl = await BlobStorage.uploadFile(
      processedImage,
      file.name,
      "image"
    );

    return c.json({
      message: "success",
      image: {
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
      error: "error processing image",
    });
  }
};

export default { resize, rotate, flip };
