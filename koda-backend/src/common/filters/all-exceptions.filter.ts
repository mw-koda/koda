import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ExceptionLike = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private serializeUnknown(value: unknown): string {
    if (value instanceof Error) {
      return value.stack ?? value.message;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Unserializable object]';
      }
    }

    return String(value);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const responseObject = responseBody as ExceptionLike;

        message = responseObject.message ?? exception.message;
        error = responseObject.error;
      } else {
        message = exception.message;
      }
    } else if (typeof exception === 'object' && exception !== null) {
      const exceptionObject = exception as ExceptionLike;
      if (exceptionObject.message) {
        message = exceptionObject.message;
      }

      if (exceptionObject.error) {
        error = exceptionObject.error;
      }
    }

    this.logger.error(
      `HTTP ${status} ${request.method} ${request.url} Error: ${Array.isArray(message) ? message.join(', ') : message}`,
      this.serializeUnknown(exception),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
    });
  }
}
