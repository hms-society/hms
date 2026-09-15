export interface CryptoProvider {
  encrypt(text: string): string
  decrypt(encryptedText: string): string
}
