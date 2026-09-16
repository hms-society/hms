import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@hms/core/shared/domain/errors'
import {
  DynamicFormDefinitionValidationError,
  DynamicFormNameConflictError,
  DynamicFormVersionConflictError,
  IdempotencyKeyConflictError,
} from '@hms/core/legal-catalog/domain/errors'
import { FormalizationContractFormValidationError } from '@hms/core/formalization/domain/errors'
import { ZodValidationException } from 'nestjs-zod'

export type ErrorResponse = {
  readonly statusCode: number
  readonly title: string
  readonly message: string
  readonly timestamp: string
  readonly path: string
  readonly code?: string
  readonly metadata?: Record<string, unknown>
  readonly issues?: readonly { path: string; message: string }[]
}

@Catch()
export class GlobalErrorHandler implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost
    const context = host.switchToHttp()
    const request = context.getRequest()
    const response = context.getResponse()
    const errorResponse = this.createErrorResponse(exception, request.url)

    httpAdapter.reply(response, errorResponse, errorResponse.statusCode)
  }

  private createErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString()

    if (exception instanceof HttpException) {
      if (exception instanceof ZodValidationException) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          title: 'BAD_REQUEST',
          message: 'Validation failed',
          timestamp,
          path,
          code: 'ZOD_VALIDATION_ERROR',
          issues: this.getZodIssues(exception),
        }
      }

      const statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      return {
        statusCode,
        title: this.getHttpErrorTitle(exceptionResponse, statusCode),
        message: this.getHttpErrorMessage(exceptionResponse, exception.message),
        timestamp,
        path,
      }
    }

    if (exception instanceof NotFoundError) {
      return this.createSharedErrorResponse(exception, HttpStatus.NOT_FOUND, path)
    }

    if (exception instanceof BadRequestError) {
      return this.createSharedErrorResponse(exception, HttpStatus.BAD_REQUEST, path)
    }

    if (exception instanceof ConflictError) {
      return this.createSharedErrorResponse(exception, HttpStatus.CONFLICT, path)
    }

    if (exception instanceof ForbiddenError) {
      return this.createSharedErrorResponse(exception, HttpStatus.FORBIDDEN, path)
    }

    if (this.isAppError(exception)) {
      return this.createSharedErrorResponse(
        exception,
        HttpStatus.INTERNAL_SERVER_ERROR,
        path,
      )
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Erro Interno da Aplicação',
      message: 'Ocorreu um erro inesperado.',
      timestamp,
      path,
    }
  }

  private createSharedErrorResponse(
    exception: AppError,
    statusCode: number,
    path: string,
  ): ErrorResponse {
    return {
      statusCode,
      title: exception.title,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path,
      ...(exception instanceof FormalizationContractFormValidationError
        ? {
            issues: exception.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          }
        : {}),
      ...(exception instanceof DynamicFormDefinitionValidationError
        ? {
            code: 'DYNAMIC_FORM_DEFINITION_INVALID',
            issues: exception.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          }
        : {}),
      ...(exception instanceof DynamicFormVersionConflictError
        ? {
            code: 'DYNAMIC_FORM_VERSION_CONFLICT',
            metadata: {
              dynamicFormId: exception.dynamicFormId,
              expectedVersion: exception.expectedVersion,
              currentVersion: exception.currentVersion,
            },
          }
        : {}),
      ...(exception instanceof DynamicFormNameConflictError
        ? {
            code: 'DYNAMIC_FORM_NAME_CONFLICT',
            metadata: { existingDynamicFormId: exception.existingDynamicFormId },
          }
        : {}),
      ...(exception instanceof IdempotencyKeyConflictError
        ? {
            code: 'IDEMPOTENCY_KEY_CONFLICT',
            metadata: {
              operationKey: exception.operationKey,
              originalAction: exception.originalAction,
              originalTargetDynamicFormId: exception.originalTargetDynamicFormId,
            },
          }
        : {}),
    }
  }

  private getHttpErrorTitle(exceptionResponse: unknown, statusCode: number) {
    if (this.isRecord(exceptionResponse) && typeof exceptionResponse.error === 'string') {
      return exceptionResponse.error
    }

    return HttpStatus[statusCode] ?? 'Erro HTTP'
  }

  private getHttpErrorMessage(exceptionResponse: unknown, fallback: string) {
    if (typeof exceptionResponse === 'string') return exceptionResponse

    if (!this.isRecord(exceptionResponse)) return fallback

    const message = exceptionResponse.message

    if (Array.isArray(message)) return message.join('; ')
    if (typeof message === 'string') return message

    return fallback
  }

  private getZodIssues(exception: ZodValidationException) {
    const error = exception.getZodError()
    if (!this.isRecord(error) || !Array.isArray(error.issues)) return []

    return error.issues.flatMap((issue) => {
      if (!this.isRecord(issue) || typeof issue.message !== 'string') return []

      const issuePath = Array.isArray(issue.path)
        ? issue.path.map((segment) => String(segment)).join('.')
        : ''
      return [{ path: issuePath, message: issue.message }]
    })
  }

  private isAppError(exception: unknown): exception is AppError {
    return exception instanceof AppError
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }
}
