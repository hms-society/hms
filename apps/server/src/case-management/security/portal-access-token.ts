import { createHash, randomBytes } from 'node:crypto'

export const PORTAL_ACCESS_TOKEN_HEADER = 'x-portal-access-token'

export function createPortalAccessToken() {
  return randomBytes(32).toString('hex')
}

export function hashPortalAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
