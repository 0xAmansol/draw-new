import { JWT_SECRET } from "@workspace/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function middleware(res: Response, req: Request, next: NextFunction) {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
}
