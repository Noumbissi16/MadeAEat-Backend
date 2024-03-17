import { StatusCodes } from "http-status-codes";
import { CustomApiError } from "./custom-error";

class BadRequest extends CustomApiError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export { BadRequest };
