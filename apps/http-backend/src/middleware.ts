import { JWT_SECRET } from "@workspace/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface middlewareOptions {
  req: Request;
  res: Response;
  next: NextFunction;
}

export function middleware({ req, res, next }: middlewareOptions): void {
  const token = req.headers.authorization;
  if (!token) {
    res.status(403).json({
      message: "No token provided",
    });
    return;
  }

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  try {
    if (decoded && decoded.userId == "string") {
      req.userId = decoded.userId;
      next();
    } else {
      res.status(403).json({
        message: "invalid token",
      });
    }
  } catch (error) {
    res.status(403).json({
      message: "invalid token",
    });
  }
}
