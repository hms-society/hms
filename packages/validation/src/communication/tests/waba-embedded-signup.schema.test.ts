import { describe, expect, it } from 'vitest'
import { registerWabaAccountSchema } from './waba-embedded-signup.schema'

describe('wabaEmbeddedSignupSchema', () => {
  it('should validate valid WABA registration input', () => {
    const validPayload = {
      lawyerId: '123e4567-e89b-12d3-a456-426614174000',
      code: 'valid_meta_code',
      wabaId: 'waba_123',
      phoneNumberId: 'phone_456',
    }

    const result = registerWabaAccountSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('should reject invalid lawyer UUID', () => {
    const invalidPayload = {
      lawyerId: 'invalid-uuid',
      code: 'valid_meta_code',
      wabaId: 'waba_123',
      phoneNumberId: 'phone_456',
    }

    const result = registerWabaAccountSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
  })
})
