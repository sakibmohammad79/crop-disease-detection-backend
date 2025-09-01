import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export const apiNotFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API not found!",
    error: {
      path: req.originalUrl,
      message: "Your requested path not found!",
    },
  });
};
