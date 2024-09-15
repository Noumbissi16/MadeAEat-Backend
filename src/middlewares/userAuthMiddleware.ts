import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { BadRequest, UnauthenticatedError } from "../errors";
import { ClientModel } from "../db/models/client";

const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("No token provided or wrong token format");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded.userId) {
      throw new BadRequest("Invalid token");
    }

    const client = await ClientModel.findById(decoded.userId);

    if (!client) {
      throw new UnauthenticatedError("Not authorized to access this route");
    }

    (req as any).user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Not authorized to access this route");
  }
};

export default userAuthMiddleware;
