import { CoreStatus } from "../constants/response.constant";
import { ErrorResponse, SuccessResponse } from "../types/response.types";

export class ResponseUtil {
  static success<T>(
    data: T,
    message = "Operation successful",
    code = 200,
  ): SuccessResponse<T> {
    return {
      status: CoreStatus.SUCCESS,
      message,
      code,
      data,
    };
  }

  static error(
    error: unknown,
    message = "An error occurred",
    code = 500,
  ): ErrorResponse {
    return {
      status: CoreStatus.FAIL,
      message,
      code,
      error,
    };
  }
}
