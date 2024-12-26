import { ResponseUtil } from "@/shared/utils/response.util";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class ExceptionHandlerService implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    const error = exception.message;

    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse();
      status = exception.getStatus();
      message = typeof httpResponse === "string"
        ? httpResponse
        : (httpResponse as any).message || message;
    }

    response.status(status).json(
      ResponseUtil.error(error, message, status),
    );
  }
}
