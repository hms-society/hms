export function encodeSignatureHash(value: string) {
  return Buffer.from(value, 'hex')
}

export function decodeSignatureHash(value: Buffer) {
  return value.toString('hex')
}

export function encodeSignaturePayload(value: string) {
  return Buffer.from(value)
}

export function decodeSignaturePayload(value: Buffer) {
  return value.toString()
}
