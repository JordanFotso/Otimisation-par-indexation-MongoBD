import { Request, Response } from "express";

export const getStatus = (req: Request, res: Response) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    message: "MongoDB Optimization API is ready"
  });
};
