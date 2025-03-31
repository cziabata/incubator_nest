import { Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionsFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    if (Array.isArray(exceptionResponse.message)) {
      const errors = exceptionResponse.message.map((error: ValidationError) => ({
        message: error.constraints ? Object.values(error.constraints)[0] : 'Validation failed',
        field: error.property,
      }));

      response.status(status).json({
        errorsMessages: errors,
      });
    } else {
      response.status(status).json({
        errorsMessages: [
          {
            message: exceptionResponse.message,
            field: 'unknown',
          },
        ],
      });
    }
  }
} 