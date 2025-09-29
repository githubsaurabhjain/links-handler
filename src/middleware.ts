import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const isDevKeyValid = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.headers.devkey !== process.env.Dev_Key) {
    res.status(400).json({
      message: "Invalid devkey",
      status: false,
      error: "Request validation failed",
    });
    return;
  }
  next();
};

export function verifySessionToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req?.headers?.["token"] as string;

  try {
    const result = jwt.verify(token, process.env.JWT_SECRET_KEY!);

    req.body = { ...req.body, ...(result as {}) };
    (req as any).user = result;
    next();
  } catch (error) {
    res.status(401).send({
      status: false,
      message: "Session Expired, please login again",
      error: error instanceof Error && error.message,
    });
  }
}
