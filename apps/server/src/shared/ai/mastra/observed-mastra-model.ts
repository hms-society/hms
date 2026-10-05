import { ModelRouterLanguageModel, type OpenAICompatibleConfig } from '@mastra/core/llm'
import { metrics, SpanKind, SpanStatusCode, trace, type Span } from '@opentelemetry/api'

type ModelOptions = Parameters<ModelRouterLanguageModel['doGenerate']>[0]
type ModelResult = Awaited<ReturnType<ModelRouterLanguageModel['doGenerate']>>

// Native Mastra inference spans can cover several fallback routes. This records
// each attempted route independently, including failures before a response exists.
export class ObservedMastraModel extends ModelRouterLanguageModel {
  private readonly tracer = trace.getTracer('hms-mastra')
  private readonly attempts = metrics
    .getMeter('hms-mastra')
    .createCounter('hms.ai.model.attempts')

  constructor(
    config: OpenAICompatibleConfig,
    private readonly agentId: string,
    private readonly routeIndex: number,
    private readonly routeProvider = 'openrouter',
  ) {
    super(config)
  }

  override doGenerate(options: ModelOptions): Promise<ModelResult> {
    return this.observeCall(() => super.doGenerate(options))
  }

  override doStream(options: ModelOptions): Promise<ModelResult> {
    return this.observeCall(() => super.doStream(options))
  }

  private observeCall(execute: () => Promise<ModelResult>): Promise<ModelResult> {
    const attributes = {
      'gen_ai.request.model': this.modelId,
      'gen_ai.provider.name': this.provider,
      'gen_ai.agent.id': this.agentId,
      'hms.ai.route.provider': this.routeProvider,
      'hms.ai.route.index': this.routeIndex,
      'hms.ai.fallback': this.routeIndex > 0,
    }
    return this.tracer.startActiveSpan(
      'hms.ai.model.attempt',
      { kind: SpanKind.CLIENT, attributes },
      async (span) => {
        let hasEnded = false
        const model = this
        function finish(outcome: 'success' | 'error' | 'cancelled', error?: unknown) {
          if (hasEnded) return
          hasEnded = true
          if (outcome !== 'success') model.markError(span, error)
          span.setAttribute('hms.ai.outcome', outcome)
          model.attempts.add(1, { ...attributes, 'hms.ai.outcome': outcome })
          span.end()
        }
        try {
          const result = await execute()
          const reader = result.stream.getReader()
          const stream = new ReadableStream({
            async pull(controller) {
              try {
                const chunk = await reader.read()
                if (chunk.done) {
                  finish('success')
                  controller.close()
                } else {
                  if (chunk.value.type === 'error') finish('error', chunk.value.error)
                  controller.enqueue(chunk.value)
                }
              } catch (error) {
                finish('error', error)
                controller.error(error)
              }
            },
            async cancel(reason) {
              finish('cancelled')
              await reader.cancel(reason)
            },
          })
          return { ...result, stream }
        } catch (error) {
          finish('error', error)
          throw error
        }
      },
    )
  }

  private markError(span: Span, error: unknown): void {
    span.setStatus({ code: SpanStatusCode.ERROR })
    span.setAttribute('error.type', 'AI_PROVIDER_CALL_FAILED')
    const status = (error as { statusCode?: unknown } | undefined)?.statusCode
    if (
      typeof status === 'number' &&
      Number.isInteger(status) &&
      status >= 400 &&
      status <= 599
    ) {
      span.setAttribute('http.response.status_code', status)
    }
  }
}
