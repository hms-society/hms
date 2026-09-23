export type MetaTokenExchangeResult = {
  accessToken: string
  tokenType: string
}

export type MetaPhoneNumberDetailsResult = {
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
}

export interface MetaCloudApiClient {
  exchangeCodeForToken(code: string): Promise<MetaTokenExchangeResult>
  getPhoneNumberDetails(
    phoneNumberId: string,
    accessToken: string,
  ): Promise<MetaPhoneNumberDetailsResult>
}
