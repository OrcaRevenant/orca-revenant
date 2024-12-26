import { CoreStatus } from "../constants/response.constant";

class Response {
  status: CoreStatus;
  message: string;
  code: number;
}

export interface SuccessResponse<T = unknown> extends Response {
  data: T | Array<T>;
}

export interface ErrorResponse extends Response {
  error: unknown;
}
