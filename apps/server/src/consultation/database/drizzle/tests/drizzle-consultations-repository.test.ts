import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { DrizzleConsultationsRepository } from '../repository/drizzle-consultations-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

describe('DrizzleConsultationsRepository', () => {
  let repository: DrizzleConsultationsRepository
  let drizzleClientMock: any

  const dbMock = {
    query: {
      consultationModel: {
        findFirst: vi.fn(),
      },
      collaboratorModel: {
        findFirst: vi.fn(),
      },
      clientModel: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockReturnThis(),
  }

  beforeEach(async () => {
    drizzleClientMock = {
      requireDatabase: vi.fn().mockReturnValue(dbMock),
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleConsultationsRepository,
        {
          provide: DrizzleClient,
          useValue: drizzleClientMock,
        },
      ],
    }).compile()

    repository = moduleRef.get<DrizzleConsultationsRepository>(
      DrizzleConsultationsRepository,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('deve buscar a consulta e resolver o colaborador responsável pelo intake', async () => {
      const mockConsultationRecord = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        clientId: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
        status: 'completed',
        intake: {
          id: '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
          responsibleId: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
        },
      }

      const mockCollaborator = {
        id: 'collab-1',
        userId: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
        professionalName: 'Maria Atendente',
      }

      dbMock.query.consultationModel.findFirst.mockResolvedValue(mockConsultationRecord)
      dbMock.query.collaboratorModel.findFirst.mockResolvedValue(mockCollaborator)

      const result = await repository.findById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

      expect(dbMock.query.consultationModel.findFirst).toHaveBeenCalled()
      expect(result).not.toBeNull()
    })
  })

  describe('updateClientQualification', () => {
    it('deve atualizar a qualificação do cliente formatando os campos necessários', async () => {
      const dto = {
        name: 'Morris Lemke',
        taxIdValue: '03737829420',
        birthDate: '1998-09-29',
        hmsResponsible: 'Maria Atendente',
      }

      await expect(
        repository.updateClientQualification('a97f1adf-335c-4ea8-817b-09e7f8446b3d', dto as any),
      ).resolves.not.toThrow()

      expect(dbMock.update).toHaveBeenCalled()
      expect(dbMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          hmsResponsible: 'Maria Atendente',
        }),
      )
    })
  })
})