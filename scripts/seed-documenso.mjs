import { PrismaClient } from '@prisma/client'

const adminName = process.env.DOCUMENSO_ADMIN_NAME?.trim() || 'HMS Local Admin'
const adminEmail = process.env.DOCUMENSO_ADMIN_EMAIL?.trim().toLowerCase()
const adminPassword = process.env.DOCUMENSO_ADMIN_PASSWORD
const baseUrl = (process.env.DOCUMENSO_SEED_BASE_URL || 'http://documenso:3000').replace(
  /\/$/,
  '',
)

async function main() {
  if (!adminEmail || !adminPassword) {
    console.log(
      'Documenso seed skipped: set DOCUMENSO_ADMIN_EMAIL and DOCUMENSO_ADMIN_PASSWORD to enable it.',
    )
    return
  }

  const prisma = new PrismaClient()

  try {
    const existingUser = await findUser(prisma)
    if (existingUser) {
      await verifyUser(prisma, existingUser.id)
      console.log(`Documenso account already exists: ${adminEmail}`)
      return
    }

    const response = await fetch(`${baseUrl}/api/auth/email-password/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      }),
    })

    if (!response.ok) {
      const userCreatedConcurrently = await findUser(prisma)
      if (!userCreatedConcurrently) {
        throw new Error(`Documenso signup failed with HTTP ${response.status}.`)
      }
    }

    const createdUser = await waitForUser(prisma)
    if (!createdUser) throw new Error('Documenso signup completed without creating a user.')

    await verifyUser(prisma, createdUser.id)
    console.log(`Seeded verified Documenso account: ${adminEmail}`)
  } finally {
    await prisma.$disconnect()
  }
}

async function findUser(prisma) {
  return prisma.user.findFirst({ where: { email: adminEmail } })
}

async function waitForUser(prisma) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const user = await findUser(prisma)
    if (user) return user
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return null
}

async function verifyUser(prisma, userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Documenso seed failed.')
  process.exitCode = 1
})
