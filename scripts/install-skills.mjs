import { spawn } from 'node:child_process'

const child = spawn(
  'npx',
  ['skills', 'add', 'https://github.com/anthropics/skills', '--skill', 'frontend-design'],
  { shell: true, stdio: 'inherit' },
)

child.on('error', (error) => {
  console.error(error.message)
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
