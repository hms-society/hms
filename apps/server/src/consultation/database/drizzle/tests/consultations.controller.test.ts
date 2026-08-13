import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  GetConsultationByIdController,
  UpdateClientQualificationController,
} from '../rest/controllers'
import { GetConsultationByIdUseCase } from '@hms/core/consultation/use-cases'
import { DrizzleConsultationsRepository } from '../repository/drizzle-consultations-repository'
import { AuthGuard } from '@/identity/guards'

describe('Consultation Controllers', () => {
  let getByIdController: GetConsultationByIdController
  let updateQualificationController: UpdateClientQualificationController
  let getConsultationByIdUseCaseMock: { execute: ReturnType<typeof vi.fn> }
  let consultationsRepositoryMock: {
    findById: ReturnType<typeof vi.fn>
    updateClientQualification: ReturnType<typeof vi.fn>
  }

  const mockConsultationDomain = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    clientId: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
    status: 'completed',
    attendant: { name: 'Maria Atendente' },
    intake: { attendantName: 'Maria Atendente' },
  }

  beforeEach(async () => {
    consultationsRepositoryMock = {
      findById: vi.fn(),
      updateClientQualification: vi.fn(),
    }

    getConsultationByIdUseCaseMock = {
      execute: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetConsultationByIdController, UpdateClientQualificationController],
      providers: [
        {
          provide: GetConsultationByIdUseCase,
          useValue: getConsultationByIdUseCaseMock,
        },
        {
          provide: DrizzleConsultationsRepository,
          useValue: consultationsRepositoryMock,
        },
        {
          provide: 'ConsultationsRepository',
          useValue: consultationsRepositoryMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    getByIdController = module.get(GetConsultationByIdController)
    updateQualificationController = module.get(UpdateClientQualificationController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GetConsultationByIdController', () => {
    it('returns consultation details when found', async () => {
      vi.spyOn(getByIdController['useCase'], 'execute').mockResolvedValue(
        mockConsultationDomain as any,
      )

      const result = await getByIdController.handle(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      )

      expect(result).toBeDefined()
    })

    it('throws NotFoundException when consultation does not exist', async () => {
      vi.spyOn(getByIdController['useCase'], 'execute').mockRejectedValue(
        new Error('Consulta não encontrada.'),
      )

      await expect(getByIdController.handle('invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('UpdateClientQualificationController', () => {
    it('delegates client qualification update to repository', async () => {
      const consultationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      const dto: any = { name: 'Morris Lemke' }

      consultationsRepositoryMock.findById.mockResolvedValue(mockConsultationDomain)
      consultationsRepositoryMock.updateClientQualification.mockResolvedValue(undefined)

      await expect(
        updateQualificationController.handle(consultationId, dto),
      ).resolves.not.toThrow()

      expect(consultationsRepositoryMock.updateClientQualification).toHaveBeenCalledWith(
        mockConsultationDomain.clientId,
        dto,
      )
    })
  })
})
