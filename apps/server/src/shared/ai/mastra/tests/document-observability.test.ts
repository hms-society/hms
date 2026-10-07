import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { context, metrics, trace, SpanStatusCode } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'

import {
  DocumentWriterAgent,
  DocumentReviewerAgent,
} from '@/document-production/ai/mastra/agents'
import { GenerateDocumentWorkflow } from '@/document-production/ai/mastra/workflows/generate-document-workflow'
import { ReviewDocumentCycleTool } from '@/document-production/ai/mastra/tools/review-document-cycle-tool'
import { ResolveDocumentGenerationOutcomeTool } from '@/document-production/ai/mastra/tools/resolve-document-generation-outcome-tool'
import { observeAiJob } from '@/shared/ai/mastra/observe-ai-job'
import type { EnvProvider } from '@/shared/provision/env/env-provider'

const GENERATION_ID = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1'
const DOCUMENT_ID = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba2'
const TEMPLATE_VERSION_ID = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba3'
const VERSION_ID = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba4'
const PRIVATE_DATA = 'PRIVATE_CLIENT_DOCUMENT_CPF_12345678900'
const DRAFT = {
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: PRIVATE_DATA }] }],
  },
}

describe('Document production OpenTelemetry integration', () => {
  let sdk: NodeSDK
  let spans: any[]
  let metricExporter: InMemoryMetricExporter
  let reader: PeriodicExportingMetricReader

  beforeEach(() => {
    spans = []
    metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE)
    reader = new PeriodicExportingMetricReader({ exporter: metricExporter })
    sdk = new NodeSDK({
      autoDetectResources: false,
      serviceName: 'hms-server',
      spanProcessors: [
        {
          onStart() {},
          onEnd(span) {
            spans.push(span)
          },
          async forceFlush() {},
          async shutdown() {},
        },
      ],
      metricReaders: [reader],
    })
    sdk.start()
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    await sdk.shutdown()
    trace.disable()
    metrics.disable()
    context.disable()
  })

  it('exports native writer/reviewer spans, correlation, fallback model and tokens without content', async () => {
    const requestedModels: string[] = []
    stubModels(requestedModels)
    const workflow = createWorkflow(true)
    await observeAiJob(
      { 'hms.inngest.run_id': 'inngest-run-test', 'hms.document.id': DOCUMENT_ID },
      () => workflow.run(createInput()),
    )
    await vi.waitFor(() =>
      expect(
        spans.some((span) => span.attributes['mastra.span.type'] === 'workflow_run'),
      ).toBe(true),
    )
    const job = spans.find(
      (span) => span.name === 'hms.document-production.generate-document',
    )
    const workflowSpan = spans.find(
      (span) =>
        span.attributes['mastra.span.type'] === 'workflow_run' &&
        span.name === 'invoke_workflow generate-document-workflow',
    )
    expect(job.attributes['hms.inngest.run_id']).toBe('inngest-run-test')
    expect(workflowSpan).toBeDefined()
    expect(workflowSpan.spanContext().traceId).toBe(job.spanContext().traceId)
    expect(workflowSpan.parentSpanContext?.spanId).toBe(job.spanContext().spanId)
    expect(workflowSpan.attributes['mastra.metadata.documentId']).toBe(DOCUMENT_ID)
    expect(workflowSpan.attributes['mastra.metadata.documentGenerationId']).toBe(
      GENERATION_ID,
    )
    expect(workflowSpan.attributes['mastra.metadata.documentVersionId']).toBe(VERSION_ID)
    expect(workflowSpan.attributes['mastra.metadata.generationOutcome']).toBe('approved')

    const agents = spans.filter(
      (span) => span.attributes['mastra.span.type'] === 'agent_run',
    )
    expect(agents.map((span) => span.attributes['gen_ai.agent.id']).sort()).toEqual([
      'document-reviewer',
      'document-writer',
    ])
    expect(
      agents.every((span) => span.spanContext().traceId === job.spanContext().traceId),
    ).toBe(true)
    expect(
      agents.every((span) => span.attributes['mastra.metadata.reviewAttempt'] === 1),
    ).toBe(true)
    expect(requestedModels).toEqual([
      'qwen/qwen3.8-27b:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'qwen/qwen3.8-27b:free',
    ])
    const attempts = spans.filter((span) => span.name === 'hms.ai.model.attempt')
    expect(attempts).toHaveLength(3)
    expect(attempts.map((span) => span.attributes['hms.ai.route.index'])).toEqual([
      0, 1, 0,
    ])
    expect(attempts[0].attributes['http.response.status_code']).toBe(429)
    expect(attempts[0].status.code).toBe(SpanStatusCode.ERROR)
    expect(attempts[1].attributes['hms.ai.fallback']).toBe(true)
    expect(
      attempts.every((span) => span.spanContext().traceId === job.spanContext().traceId),
    ).toBe(true)
    expect(
      spans.some(
        (span) =>
          span.attributes['gen_ai.response.model'] ===
          'nvidia/nemotron-3-super-120b-a12b:free',
      ),
    ).toBe(true)
    const cycle = spans.find(
      (span) => span.attributes['mastra.metadata.reviewDecision'] === 'approved',
    )
    expect(cycle).toBeDefined()

    const exported = JSON.stringify(
      spans.map((span) => ({
        name: span.name,
        attributes: span.attributes,
        events: span.events,
        status: span.status,
      })),
    )
    expect(exported).not.toContain(PRIVATE_DATA)
    expect(exported).not.toContain('test-secret-key')
    expect(exported).not.toContain('instructions')
    expect(exported).not.toContain('gen_ai.input.messages')
    expect(exported).not.toContain('gen_ai.output.messages')

    await reader.forceFlush()
    const tokenMetrics = metricExporter
      .getMetrics()
      .flatMap((batch) => batch.scopeMetrics)
      .flatMap((scope) => scope.metrics)
      .filter((metric) => metric.descriptor.name === 'hms.ai.token.usage')
    expect(tokenMetrics).toHaveLength(1)
    expect(
      tokenMetrics[0].dataPoints.reduce((total, point) => total + Number(point.value), 0),
    ).toBe(30)
    expect(JSON.stringify(tokenMetrics)).not.toContain(DOCUMENT_ID)
  })

  it('marks failures while preserving the original rejection and removing provider error payloads', async () => {
    stubModels([], true)
    const workflow = createWorkflow(true)
    await expect(observeAiJob({}, () => workflow.run(createInput()))).rejects.toThrow()
    await vi.waitFor(() =>
      expect(spans.some((span) => span.status.code === SpanStatusCode.ERROR)).toBe(true),
    )
    const exported = JSON.stringify(
      spans.map((span) => ({
        name: span.name,
        attributes: span.attributes,
        events: span.events,
        status: span.status,
      })),
    )
    expect(exported).not.toContain(PRIVATE_DATA)
    expect(exported).not.toContain('test-secret-key')
    expect(
      spans.find((span) => span.name === 'hms.document-production.generate-document')
        .status.code,
    ).toBe(SpanStatusCode.ERROR)
  })

  it('does not create Mastra spans when the OTLP endpoint is absent', async () => {
    stubModels([], false, false)
    await createWorkflow(false).run(createInput())
    expect(spans).toEqual([])
    await reader.forceFlush()
    expect(
      metricExporter
        .getMetrics()
        .flatMap((batch) => batch.scopeMetrics)
        .flatMap((scope) => scope.metrics),
    ).toEqual([])
  })

  it('identifies each pinned production provider even when fallback models have the same ID', async () => {
    stubModels([], true)
    await expect(createWorkflow(true, 'prod').run(createInput())).rejects.toThrow()
    const attempts = spans.filter((span) => span.name === 'hms.ai.model.attempt')
    expect(attempts.map((span) => span.attributes['hms.ai.route.provider'])).toEqual([
      'deepinfra',
      'coreweave',
      'nextbit',
      'azure',
      'openai',
    ])
    expect(attempts.map((span) => span.attributes['hms.ai.route.index'])).toEqual([
      0, 1, 2, 3, 4,
    ])
    expect(attempts.every((span) => span.status.code === SpanStatusCode.ERROR)).toBe(true)
  })

  it('keeps concurrent generation traces and identifiers separate', async () => {
    stubModels([], false, false)
    const workflow = createWorkflow(true)
    const secondGenerationId = '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba6'
    await Promise.all([
      workflow.run(createInput()),
      workflow.run({ ...createInput(), documentGenerationId: secondGenerationId }),
    ])
    const roots = spans.filter(
      (span) => span.name === 'invoke_workflow generate-document-workflow',
    )
    expect(roots).toHaveLength(2)
    expect(new Set(roots.map((span) => span.spanContext().traceId)).size).toBe(2)
    for (const root of roots) {
      const agents = spans.filter(
        (span) =>
          span.attributes['mastra.span.type'] === 'agent_run' &&
          span.spanContext().traceId === root.spanContext().traceId,
      )
      expect(agents).toHaveLength(2)
      expect(
        agents.every(
          (span) =>
            span.attributes['mastra.metadata.documentGenerationId'] ===
            root.attributes['mastra.metadata.documentGenerationId'],
        ),
      ).toBe(true)
    }
  })
  it('records three review cycles and the domain failure without exposing review findings', async () => {
    stubModels([], false, false, true)
    await createWorkflow(true).run(createInput())
    const roots = spans.filter(
      (span) => span.name === 'invoke_workflow generate-document-workflow',
    )
    expect(roots).toHaveLength(1)
    expect(roots[0].attributes['mastra.metadata.generationOutcome']).toBe('failed')
    const cycles = spans.filter(
      (span) => span.attributes['mastra.metadata.reviewDecision'] === 'changes_required',
    )
    expect(
      cycles.map((span) => span.attributes['mastra.metadata.reviewAttempt']),
    ).toEqual([1, 2, 3])
    expect(
      spans.filter((span) => span.attributes['mastra.span.type'] === 'agent_run'),
    ).toHaveLength(6)
    expect(JSON.stringify(spans.map((span) => span.attributes))).not.toContain(
      PRIVATE_DATA,
    )
  })
})

function createInput() {
  return {
    documentGenerationId: GENERATION_ID,
    documentId: DOCUMENT_ID,
    documentSpecificationVersionId: TEMPLATE_VERSION_ID,
    requestedByCollaboratorId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba5',
    instructions: PRIVATE_DATA,
    source: {
      type: 'consultation' as const,
      id: DOCUMENT_ID,
      data: { private: PRIVATE_DATA },
    },
  }
}

function createWorkflow(isEnabled: boolean, mode = 'dev') {
  const envProvider = {
    get(key: string) {
      if (key === 'HMS_SERVER_APP_MODE') return mode
      if (key === 'AI_PROVIDER') return 'openrouter'
      if (key === 'OTEL_EXPORTER_OTLP_ENDPOINT')
        return isEnabled ? 'http://localhost:4318' : undefined
      return 'test-secret-key'
    },
  } as EnvProvider
  const writer = new DocumentWriterAgent(envProvider)
  const reviewer = new DocumentReviewerAgent(envProvider)
  const cycle = new ReviewDocumentCycleTool(
    writer,
    reviewer,
    new FindDocumentPendingMarkersUseCase(),
  )
  const prepare = createAdapter('prepare-document-generation', (input) => ({
    ...input,
    id: input.documentGenerationId,
    template: { name: PRIVATE_DATA, content: DRAFT.content, variables: [] },
  }))
  const save = createAdapter('save-generated-document-version', (input) => ({
    ...input,
    status: 'approved',
    documentVersionId: VERSION_ID,
  }))
  return new GenerateDocumentWorkflow(
    createAdapter('load-document-generation'),
    prepare,
    createAdapter('start-document-generation'),
    save,
    createAdapter('fail-document-generation', (input) => ({
      status: 'failed',
      documentGenerationId: input.documentGenerationId,
      attemptsCount: input.attemptsCount,
      findings: input.review.findings.map((finding: any) => ({
        category: finding.category,
        message: finding.description,
      })),
    })),
    cycle,
    new ResolveDocumentGenerationOutcomeTool(),
    writer,
    reviewer,
    envProvider,
  )
}

function createAdapter(id: string, execute: (input: any) => any = (input) => input): any {
  return {
    function: createTool({
      id,
      description: 'Test persistence adapter',
      inputSchema: z.any(),
      outputSchema: z.any(),
      execute,
    }),
  }
}

function stubModels(
  requestedModels: string[],
  alwaysFail = false,
  useFallback = true,
  needsCorrection = false,
) {
  let hasFailed = false
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body)
      requestedModels.push(body.model)
      if (alwaysFail || (useFallback && !hasFailed)) {
        hasFailed = true
        return Response.json(
          { error: { message: PRIVATE_DATA, code: 429 } },
          { status: 429 },
        )
      }
      return Response.json({
        id: 'test-completion',
        object: 'chat.completion',
        created: 0,
        model: body.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify(
                body.response_format
                  ? needsCorrection
                    ? {
                        decision: 'changes_required',
                        findings: [
                          {
                            category: 'structure',
                            description: PRIVATE_DATA,
                            correction: PRIVATE_DATA,
                          },
                        ],
                      }
                    : { decision: 'approved', findings: [] }
                  : DRAFT,
              ),
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
    }),
  )
}
