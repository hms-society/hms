export function isValidSupabaseServerKey(key: string): boolean {
  return key.startsWith('sb_secret_') || key.split('.').length === 3
}
