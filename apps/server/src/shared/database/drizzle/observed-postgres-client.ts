import { metrics, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'
import type postgres from 'postgres'

const tracer = trace.getTracer('hms-postgres')
const duration = metrics
  .getMeter('hms-postgres')
  .createHistogram('db.client.operation.duration', {
    description: 'Duration of PostgreSQL client operations',
    unit: 's',
  })

const operationName = (statement: string): string => {
  const operation =
    /^\s*(SELECT|INSERT|UPDATE|DELETE|MERGE|WITH|CALL|BEGIN|COMMIT|ROLLBACK)\b/i.exec(
      statement,
    )?.[1]
  return operation?.toUpperCase() ?? 'OTHER'
}

const errorType = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'OTHER'
  }

  const code = error.code
  return typeof code === 'string' && /^[A-Z0-9]{5}$/.test(code) ? code : 'OTHER'
}

const observeQuery = <T extends postgres.PendingQuery<postgres.Row[]>>(
  query: T,
  operation: string,
): T => {
  const originalThen = query.then.bind(query)
  let execution: Promise<unknown> | undefined

  const run = (): Promise<unknown> => {
    if (execution) return execution

    const startedExecution = tracer.startActiveSpan(
      `postgresql ${operation}`,
      { kind: SpanKind.CLIENT },
      (span) => {
        const attributes = {
          'db.system.name': 'postgresql',
          'db.operation.name': operation,
        }
        span.setAttributes(attributes)
        const started = performance.now()

        return originalThen(
          (result) => {
            duration.record((performance.now() - started) / 1000, attributes)
            span.end()
            return result
          },
          (error: unknown) => {
            const failureAttributes = {
              ...attributes,
              'error.type': errorType(error),
            }
            duration.record((performance.now() - started) / 1000, failureAttributes)
            span.setAttribute('error.type', failureAttributes['error.type'])
            span.setStatus({ code: SpanStatusCode.ERROR })
            // Exception messages may include SQL or client data. Never record them.
            span.end()
            throw error
          },
        )
      },
    )
    execution = startedExecution
    return startedExecution
  }

  // Postgres.js queries execute lazily when awaited. Keep its original query
  // object and chainable .values() behavior, but time its first execution.
  Object.defineProperties(query, {
    // biome-ignore lint/suspicious/noThenProperty: Postgres.js queries are already thenables; this observes their first execution.
    then: {
      value: (
        onFulfilled?: (value: unknown) => unknown,
        onRejected?: (error: unknown) => unknown,
      ) => run().then(onFulfilled, onRejected),
    },
    catch: {
      value: (onRejected?: (error: unknown) => unknown) => run().catch(onRejected),
    },
    finally: { value: (onFinally?: () => void) => run().finally(onFinally) },
  })

  return query
}

type ObservableSql = postgres.Sql | postgres.TransactionSql

const observeSql = <T extends ObservableSql>(client: T): T =>
  new Proxy(client, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver)

      if (property === 'unsafe') {
        return (statement: string, ...args: unknown[]) =>
          observeQuery(
            Reflect.apply(value as (...args: unknown[]) => unknown, target, [
              statement,
              ...args,
            ]) as postgres.PendingQuery<postgres.Row[]>,
            operationName(statement),
          )
      }

      if (property === 'begin' || property === 'savepoint') {
        return (...args: unknown[]) =>
          Reflect.apply(
            value as (...args: unknown[]) => unknown,
            target,
            args.map((arg) =>
              typeof arg === 'function'
                ? (transactionClient: postgres.TransactionSql) =>
                    (arg as (client: postgres.TransactionSql) => unknown)(
                      observeSql(transactionClient),
                    )
                : arg,
            ),
          )
      }

      return value
    },
  })

export const observePostgresClient = (client: postgres.Sql): postgres.Sql =>
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? observeSql(client) : client
