import { OtelBridge } from '@mastra/otel-bridge'
import {
  SpanType,
  TracingEventType,
  type AnyExportedSpan,
  type CreateSpanOptions,
  type LogEvent,
  type TracingEvent,
} from '@mastra/core/observability'
import { metrics } from '@opentelemetry/api'

// Only operational identifiers are allowed. Prompts, documents, schemas, provider
// payloads and error details never reach the existing OTLP exporter.
export class GrafanaOtelBridge extends OtelBridge {
  private readonly meter = metrics.getMeter('hms-mastra')
  private readonly duration = this.meter.createHistogram('hms.ai.operation.duration', {
    unit: 's',
    description: 'Duration of Mastra operations',
  })
  private readonly tokens = this.meter.createCounter('hms.ai.token.usage', {
    unit: '{token}',
    description: 'Model generation tokens, counted once per generation',
  })

  override createSpan(options: CreateSpanOptions<SpanType>) {
    return super.createSpan({ ...options, name: `mastra.${options.type}` })
  }

  override async onLogEvent(_event: LogEvent): Promise<void> {
    // Docker logs already use Alloy. Do not duplicate raw Mastra log messages.
  }

  protected override async _exportTracingEvent(event: TracingEvent): Promise<void> {
    const span = this.sanitizeSpan(event.exportedSpan)
    if (event.type === TracingEventType.SPAN_ENDED) this.recordMetrics(span)
    await super._exportTracingEvent({ ...event, exportedSpan: span })
  }

  private sanitizeSpan(span: AnyExportedSpan): AnyExportedSpan {
    const attributes: Record<string, unknown> = {}
    const source = span.attributes as Record<string, unknown> | undefined
    for (const key of ['model', 'provider', 'responseModel', 'finishReason', 'status']) {
      const value = source?.[key]
      if (typeof value === 'string' && /^[a-zA-Z0-9_./:-]{1,160}$/.test(value)) {
        attributes[key] = value
      }
    }
    if (typeof source?.stepIndex === 'number') attributes.stepIndex = source.stepIndex
    const usage = source?.usage as Record<string, unknown> | undefined
    if (usage) {
      attributes.usage = Object.fromEntries(
        ['inputTokens', 'outputTokens'].flatMap((key) => {
          const value = usage[key]
          return typeof value === 'number' && Number.isFinite(value) && value >= 0
            ? [[key, value]]
            : []
        }),
      )
    }

    const metadata: Record<string, string | number> = {}
    for (const key of [
      'documentGenerationId',
      'documentId',
      'documentSpecificationVersionId',
      'documentVersionId',
    ]) {
      const value = span.metadata?.[key]
      if (typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)) {
        metadata[key] = value
      }
    }
    for (const key of ['reviewAttempt', 'pendingMarkersCount']) {
      const value = span.metadata?.[key]
      if (Number.isSafeInteger(value) && value >= 0) metadata[key] = value
    }
    const decision = span.metadata?.reviewDecision
    if (['approved', 'changes_required'].includes(decision)) {
      metadata.reviewDecision = decision
    }
    const outcome = span.metadata?.generationOutcome
    if (['approved', 'failed'].includes(outcome)) metadata.generationOutcome = outcome
    const entityId = span.entityId?.match(/^[a-z0-9-]{1,100}$/)?.[0]

    return {
      id: span.id,
      traceId: span.traceId,
      parentSpanId: span.parentSpanId,
      isRootSpan: span.isRootSpan,
      isEvent: span.isEvent,
      type: span.type,
      name: `mastra.${span.type}${entityId ? `.${entityId}` : ''}`,
      entityType: span.entityType,
      entityId,
      entityName: entityId,
      startTime: span.startTime,
      endTime: span.endTime,
      attributes,
      metadata,
      errorInfo: span.errorInfo
        ? { id: 'AI_OPERATION_FAILED', message: 'AI operation failed' }
        : undefined,
    }
  }

  private recordMetrics(span: AnyExportedSpan): void {
    if (!span.endTime || span.isEvent) return
    const source = span.attributes as Record<string, any> | undefined
    const labels = {
      'mastra.span.type': span.type,
      'hms.ai.entity.id': span.entityId ?? 'unknown',
      'gen_ai.request.model': source?.responseModel ?? source?.model ?? 'unknown',
      'gen_ai.provider.name': source?.provider ?? 'unknown',
      'hms.ai.outcome': span.errorInfo
        ? 'error'
        : (span.metadata?.generationOutcome ?? 'success'),
    }
    this.duration.record(
      Math.max(0, span.endTime.getTime() - span.startTime.getTime()) / 1000,
      labels,
    )
    // Inference and step spans repeat usage; count only the generation total.
    if (span.type !== SpanType.MODEL_GENERATION) return
    for (const [key, tokenType] of [
      ['inputTokens', 'input'],
      ['outputTokens', 'output'],
    ]) {
      const value = source?.usage?.[key]
      if (typeof value === 'number') {
        this.tokens.add(value, { ...labels, 'gen_ai.token.type': tokenType })
      }
    }
  }
}
