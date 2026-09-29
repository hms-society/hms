import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

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
const testRunPassed = (process.env.TEST_OUTCOME ?? 'success') === 'success'
const runUrl = process.env.GITHUB_SERVER_URL
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined
if (!['core', 'server', 'web'].includes(workspace)) {
  throw new Error(`Unknown coverage workspace: ${workspace}`)
}

const rows = metrics.map(([metric, label]) => {
  const result = summary.total?.[metric]
  if (!result) throw new Error(`Coverage summary is missing the ${metric} metric.`)
  return `| ${label} | ${result.pct}% | ${result.covered} / ${result.total} |`
})
const report = [
  `<!-- coverage-report:${workspace} -->`,
  `## Cobertura de testes: ${workspaceName}`,
  '',
  '| Métrica | Cobertura | Cobertos / Total |',
  '| --- | ---: | ---: |',
  ...rows,
  '',
  testRunPassed
    ? '✅ Execução de testes concluída. Os percentuais de cobertura são informativos.'
    : '❌ A execução de testes falhou. Os percentuais de cobertura são informativos.',
  ...(runUrl ? ['', `[Abrir execução](${runUrl})`] : []),
  '',
].join('\n')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, report)

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, report, { flag: 'a' })
}
