import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequest,
  CustomApiError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";

const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong try again later",
  };

  if (err instanceof CustomApiError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err.name === "ValidationError") {
    // customError.msg = err.message;
    customError.msg = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.code && err.code === 11000) {
    customError.msg =
      "Duplicate value entered for field " +
      Object.keys(err.keyValue) +
      ". Please choose another value";
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === "CastError") {
    customError.msg = `Not item with id : ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: err });
  return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;
