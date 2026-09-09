export type SigningGatewayCsrfStore = {
  readonly get: () => string | null
  readonly replace: (token: string) => void
  readonly clear: () => void
}

export function createSigningGatewayCsrfStore(): SigningGatewayCsrfStore {
  let value: string | null = null

  return {
    get: () => value,
    replace: (token) => {
      value = token
    },
    clear: () => {
      value = null
    },
  }
}
