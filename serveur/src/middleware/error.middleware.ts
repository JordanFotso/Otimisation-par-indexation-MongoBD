import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${status} - ${message}`);

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};
