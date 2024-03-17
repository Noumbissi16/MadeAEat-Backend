import { StatusCodes } from "http-status-codes";
import { CustomApiError } from "./custom-error";

class NotFoundError extends CustomApiError {
  constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export { NotFoundError };
