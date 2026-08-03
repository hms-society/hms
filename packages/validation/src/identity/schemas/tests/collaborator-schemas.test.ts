import { describe, expect, it } from 'vitest'

import { collaboratorListQuerySchema, registerCollaboratorSchema } from '..'

describe('Collaborator schemas', () => {
  it('normalizes list query text and applies pagination defaults and limits', () => {
    expect(
      collaboratorListQuerySchema.parse({
        search: '  maria  ',
        jobTitle: '  Advogada  ',
      }),
    ).toEqual({ search: 'maria', jobTitle: 'Advogada', page: 1, pageSize: 20 })

    expect(
      collaboratorListQuerySchema.parse({ page: '2', pageSize: '100' }),
    ).toMatchObject({ page: 2, pageSize: 100 })
    expect(collaboratorListQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    expect(collaboratorListQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false)
    expect(
      collaboratorListQuerySchema.safeParse({ page: 1, unsupported: true }).success,
    ).toBe(false)
  })

  it('normalizes collaborator registration and requires complete unique legal groups', () => {
    expect(
      registerCollaboratorSchema.parse({
        email: '  MARIA@EXAMPLE.COM ',
        professionalName: '  Maria Aparecida  ',
        jobTitle: '  Advogada  ',
        profile: 'lawyer',
        legalExpertises: [
          { legalAreaId: 'area-1', legalTopicIds: ['topic-1', 'topic-2'] },
          { legalAreaId: 'area-2', legalTopicIds: ['topic-3'] },
        ],
      }),
    ).toEqual({
      email: 'maria@example.com',
      professionalName: 'Maria Aparecida',
      jobTitle: 'Advogada',
      profile: 'lawyer',
      legalExpertises: [
        { legalAreaId: 'area-1', legalTopicIds: ['topic-1', 'topic-2'] },
        { legalAreaId: 'area-2', legalTopicIds: ['topic-3'] },
      ],
    })

    const validLegalRegistration = {
      email: 'maria@example.com',
      professionalName: 'Maria',
      profile: 'lawyer' as const,
      legalExpertises: [{ legalAreaId: 'area-1', legalTopicIds: ['topic-1'] }],
    }

    expect(
      registerCollaboratorSchema.safeParse({
        ...validLegalRegistration,
        legalExpertises: [],
      }).success,
    ).toBe(false)
    expect(
      registerCollaboratorSchema.safeParse({
        ...validLegalRegistration,
        legalExpertises: [
          { legalAreaId: 'area-1', legalTopicIds: ['topic-1'] },
          { legalAreaId: 'area-1', legalTopicIds: ['topic-2'] },
        ],
      }).success,
    ).toBe(false)
    expect(
      registerCollaboratorSchema.safeParse({
        ...validLegalRegistration,
        legalExpertises: [
          { legalAreaId: 'area-1', legalTopicIds: ['topic-1', 'topic-1'] },
        ],
      }).success,
    ).toBe(false)
  })

  it('rejects legal specialities for administrative profiles and all extras', () => {
    const administrativeRegistration = {
      email: 'admin@example.com',
      professionalName: 'Admin',
      profile: 'admin' as const,
    }

    expect(registerCollaboratorSchema.parse(administrativeRegistration)).toEqual(
      administrativeRegistration,
    )
    expect(
      registerCollaboratorSchema.safeParse({
        ...administrativeRegistration,
        legalExpertises: [],
      }).success,
    ).toBe(false)
    expect(
      registerCollaboratorSchema.safeParse({
        ...administrativeRegistration,
        extra: true,
      }).success,
    ).toBe(false)
    expect(
      registerCollaboratorSchema.safeParse({
        email: 'lawyer@example.com',
        professionalName: 'Lawyer',
        profile: 'lawyer',
        legalExpertises: [{ legalAreaId: 'area-1', legalTopicIds: ['topic-1'] }],
        extra: true,
      }).success,
    ).toBe(false)
  })
})
