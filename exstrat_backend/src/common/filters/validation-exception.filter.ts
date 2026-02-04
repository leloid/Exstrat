import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    console.error('❌ [ValidationExceptionFilter] Validation error caught:');
    console.error('  - URL:', request.url);
    console.error('  - Method:', request.method);
    console.error('  - Body:', JSON.stringify(request.body, null, 2));
    console.error('  - Status:', status);
    console.error('  - Exception response:', JSON.stringify(exceptionResponse, null, 2));

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exceptionResponse,
    });
  }
}

