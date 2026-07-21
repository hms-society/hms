import { describe, expect, it } from 'vitest'

import { HTTP_STATUS_CODE } from './http-status-code'

describe('HTTP_STATUS_CODE', () => {
  it('exposes the standard success and error codes used by the domain', () => {
    expect(HTTP_STATUS_CODE.ok).toBe(200)
    expect(HTTP_STATUS_CODE.created).toBe(201)
    expect(HTTP_STATUS_CODE.notFound).toBe(404)
    expect(HTTP_STATUS_CODE.internalServerError).toBe(500)
  })
})
