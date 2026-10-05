export const DOCUMENT_DRAFTING_PRODUCTION_MODELS = [
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'deepinfra' },
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'coreweave' },
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'nextbit' },
  { model: 'openai/gpt-6-luna', provider: 'azure' },
  { model: 'openai/gpt-6-luna', provider: 'openai' },
] as const

export const DOCUMENT_REVIEW_PRODUCTION_MODELS = [
  { model: 'openai/gpt-6-luna', provider: 'azure' },
  { model: 'openai/gpt-6-luna', provider: 'openai' },
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'deepinfra' },
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'coreweave' },
  { model: 'deepseek/deepseek-v4.1-flash', provider: 'nextbit' },
] as const
