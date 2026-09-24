import { spawnSync } from 'node:child_process'

const commands = [
  ['https://github.com/anthropics/skills', 'frontend-design'],
  ['https://github.com/juliusbrussee/caveman', 'caveman-commit'],
]

for (const [repository, skill] of commands) {
  const result = spawnSync('npx', ['skills', 'add', repository, '--skill', skill], {
    stdio: 'inherit',
  })

  if (result.error) {
    console.error(`Failed to run npx: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}
