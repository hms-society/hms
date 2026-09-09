export const FormalizationSignatureGatewaySessionKind = {
  flow: 'flow', authenticated: 'authenticated', result: 'result',
} as const
export type FormalizationSignatureGatewaySessionKind =
  (typeof FormalizationSignatureGatewaySessionKind)[keyof typeof FormalizationSignatureGatewaySessionKind]
