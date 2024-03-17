import { StatusCodes } from "http-status-codes";
import { CustomApiError } from "./custom-error";

class UnauthenticatedError extends CustomApiError {
  constructor(message: string) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export { UnauthenticatedError };
