import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

function statusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (res.headersSent || res.writableEnded) {
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as Record<string, unknown>;
        const message = Array.isArray(obj.message)
          ? String(obj.message[0] ?? 'Request failed')
          : String(obj.message ?? exception.message);

        res.status(status).json({
          statusCode: typeof obj.statusCode === 'number' ? obj.statusCode : status,
          errorCode:
            typeof obj.errorCode === 'string' ? obj.errorCode : statusToCode(status),
          message,
          details: Array.isArray(obj.details) ? obj.details : undefined,
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(status).json({
        statusCode: status,
        errorCode: statusToCode(status),
        message: typeof raw === 'string' ? raw : exception.message,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Unexpected error';
    res.status(500).json({
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
