import { SpanStatusCode, trace, type Attributes } from '@opentelemetry/api'

export async function observeAiJob<T>(
  attributes: Attributes,
  execute: () => Promise<T>,
): Promise<T> {
  return trace
    .getTracer('hms-mastra')
    .startActiveSpan(
      'hms.document-production.generate-document',
      { attributes },
      async (span) => {
        try {
          return await execute()
        } catch (error) {
          // Preserve retry behavior without exporting error messages or stacks.
          span.setStatus({ code: SpanStatusCode.ERROR })
          span.setAttribute('error.type', 'AI_OPERATION_FAILED')
          throw error
        } finally {
          span.end()
        }
      },
    )
}
