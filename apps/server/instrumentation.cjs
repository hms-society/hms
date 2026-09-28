// Preload before dist/main.js so HTTP and Express are instrumented before import.
// Telemetry is opt-in: local commands and database seeds remain unchanged.
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const { NodeSDK } = require('@opentelemetry/sdk-node')
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
  const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
  const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
  const {
    RuntimeNodeInstrumentation,
  } = require('@opentelemetry/instrumentation-runtime-node')

  process.env.OTEL_SERVICE_NAME ||= 'hms-server'
  process.env.OTEL_LOGS_EXPORTER = 'none' // Docker logs already go through Alloy.

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
      }),
    ],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) =>
          /^\/(health|docs)(?:[/?]|$)/.test(request.url || ''),
        requestHook: (span) => {
          // Paths and queries can contain client data. Express still records its
          // templated http.route attribute for useful route-level filtering.
          span.setAttribute('url.query', '[REDACTED]')
          span.setAttribute('url.full', '[REDACTED]')
          span.setAttribute('url.path', '[REDACTED]')
          span.setAttribute('http.url', '[REDACTED]')
          span.setAttribute('http.target', '[REDACTED]')
        },
      }),
      new ExpressInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  })

  sdk.start()

  process.once('SIGTERM', () => {
    sdk
      .shutdown()
      .catch(() => console.error('OpenTelemetry shutdown failed'))
      .finally(() => process.exit(0))
  })
}
