import { and, lte, or, sql } from 'drizzle-orm'

export function mapSignatureChanges(changes: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [key, value ?? null]),
  )
}

export function withNextSignatureVersion(versionColumn: any) {
  return sql`${versionColumn} + 1`
}

export function dueSignatureWork(nextAttemptAtColumn: any, now: Date) {
  return or(lte(nextAttemptAtColumn, now), sql`${nextAttemptAtColumn} is null`)
}

export function dueSignatureLease(
  nextAttemptAtColumn: any,
  leaseExpiresAtColumn: any,
  now: Date,
) {
  return and(
    or(lte(nextAttemptAtColumn, now), sql`${nextAttemptAtColumn} is null`),
    or(lte(leaseExpiresAtColumn, now), sql`${leaseExpiresAtColumn} is null`),
  )
}
