import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , workspace, summaryPath, outputPath] = process.argv

if (!workspace || !summaryPath || !outputPath) {
  throw new Error(
    'Usage: node scripts/write-coverage-report.mjs <workspace> <summary-path> <output-path>',
  )
}

const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
const metrics = [
  ['statements', 'Instruções'],
  ['branches', 'Ramificações'],
  ['functions', 'Funções'],
  ['lines', 'Linhas'],
]
const workspaceName = workspace[0].toUpperCase() + workspace.slice(1)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const coverageConfigPaths = {
  core: 'packages/core/vitest.config.mts',
  server: 'apps/server/vitest.config.mts',
  web: 'apps/web/vitest.config.ts',
}
const coveragePassed = (process.env.COVERAGE_OUTCOME ?? 'success') === 'success'
const runUrl = process.env.GITHUB_SERVER_URL
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined
const coverageConfigPath = coverageConfigPaths[workspace]
if (!coverageConfigPath) throw new Error(`Unknown coverage workspace: ${workspace}`)
const coverageConfig = await readFile(resolve(projectRoot, coverageConfigPath), 'utf8')
const thresholdsBlock = coverageConfig.match(/thresholds:\s*\{([\s\S]*?)\n\s*\}/)?.[1]
if (!thresholdsBlock) {
  throw new Error(`Coverage config is missing thresholds for ${workspace}.`)
}

const rows = metrics.map(([metric, label]) => {
  const result = summary.total?.[metric]
  if (!result) throw new Error(`Coverage summary is missing the ${metric} metric.`)
  const baseline = thresholdsBlock.match(new RegExp(`\\b${metric}:\\s*([\\d.]+)`))?.[1]
  if (!baseline) throw new Error(`Coverage config is missing the ${metric} threshold.`)
  return `| ${label} | ${result.pct}% | ${baseline}% | ${result.covered} / ${result.total} |`
})
const report = [
  `<!-- coverage-report:${workspace} -->`,
  `## Cobertura de testes: ${workspaceName}`,
  '',
  '| Métrica | Cobertura | Piso atual | Cobertos / Total |',
  '| --- | ---: | ---: | ---: |',
  ...rows,
  '',
  coveragePassed
    ? '✅ Todos os pisos de cobertura configurados no Vitest foram atingidos.'
    : '❌ Os testes ou os pisos de cobertura configurados no Vitest falharam. O resultado bloqueia a CI.',
  ...(runUrl ? ['', `[Abrir execução](${runUrl})`] : []),
  '',
].join('\n')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, report)

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, report, { flag: 'a' })
}
