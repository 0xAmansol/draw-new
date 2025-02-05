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

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization ?? "";
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  console.log(`user token is: ${token}`);
  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
  }
}
