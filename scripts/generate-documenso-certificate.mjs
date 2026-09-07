import { chmodSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..')
const SECRETS_DIRECTORY = resolve(REPOSITORY_ROOT, '.secrets')
const PRIVATE_KEY_PATH = resolve(SECRETS_DIRECTORY, 'documenso-signing.key')
const CERTIFICATE_PATH = resolve(SECRETS_DIRECTORY, 'documenso-signing.crt')
const PKCS12_PATH = resolve(SECRETS_DIRECTORY, 'documenso-signing.p12')
const CERTIFICATE_SUBJECT =
  '/C=BR/ST=SP/L=Sao Paulo/O=HMS Advogados/OU=Development/CN=HMS Documenso Development'

function runOpenSsl(argumentsList, description) {
  console.log(`\n${description}`)

  const result = spawnSync('openssl', argumentsList, { stdio: 'inherit' })

  if (result.error?.code === 'ENOENT') {
    console.error('OpenSSL não foi encontrado. Instale-o antes de executar este script.')
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`Falha: ${description}`)
    process.exit(result.status ?? 1)
  }
}

function assertTargetsDoNotExist() {
  const existingPaths = [PRIVATE_KEY_PATH, CERTIFICATE_PATH, PKCS12_PATH].filter(
    existsSync,
  )

  if (existingPaths.length === 0) return

  console.error('A geração foi interrompida para não sobrescrever arquivos existentes:')
  for (const existingPath of existingPaths) console.error(`- ${existingPath}`)
  console.error(
    'Remova ou mova esses arquivos conscientemente antes de tentar novamente.',
  )
  process.exit(1)
}

function cleanupPrivateKey() {
  rmSync(PRIVATE_KEY_PATH, { force: true })
  console.log('\nA chave intermediária não criptografada foi removida.')
}

function generateCertificate() {
  mkdirSync(SECRETS_DIRECTORY, { recursive: true, mode: 0o700 })
  chmodSync(SECRETS_DIRECTORY, 0o700)
  assertTargetsDoNotExist()

  runOpenSsl(
    ['genrsa', '-out', PRIVATE_KEY_PATH, '2048'],
    'Gerando a chave privada RSA de desenvolvimento...',
  )
  chmodSync(PRIVATE_KEY_PATH, 0o600)

  runOpenSsl(
    [
      'req',
      '-new',
      '-x509',
      '-sha256',
      '-key',
      PRIVATE_KEY_PATH,
      '-out',
      CERTIFICATE_PATH,
      '-days',
      '365',
      '-subj',
      CERTIFICATE_SUBJECT,
    ],
    'Gerando o certificado X.509 autoassinado...',
  )

  console.log('\nDefina uma senha não vazia para o arquivo PKCS#12.')
  runOpenSsl(
    [
      'pkcs12',
      '-export',
      '-out',
      PKCS12_PATH,
      '-inkey',
      PRIVATE_KEY_PATH,
      '-in',
      CERTIFICATE_PATH,
      '-name',
      'HMS Documenso Development',
    ],
    'Gerando o arquivo documenso-signing.p12...',
  )
  chmodSync(CERTIFICATE_PATH, 0o600)
  // The pinned container runs as uid 1001 while the host-created bind mount is
  // owned by the local developer. The parent directory remains private (0700),
  // and the bundle is mounted read-only into the container.
  chmodSync(PKCS12_PATH, 0o644)

  console.log('\nDigite novamente a senha para validar o arquivo gerado.')
  runOpenSsl(
    ['pkcs12', '-in', PKCS12_PATH, '-info', '-noout'],
    'Validando o arquivo PKCS#12...',
  )

  cleanupPrivateKey()

  console.log('\nCertificado de desenvolvimento criado com sucesso:')
  console.log(`- PKCS#12: ${PKCS12_PATH}`)
  console.log(`- Certificado público: ${CERTIFICATE_PATH}`)
  console.log('Guarde a senha fora do código e nunca versione esses arquivos.')
}

generateCertificate()
