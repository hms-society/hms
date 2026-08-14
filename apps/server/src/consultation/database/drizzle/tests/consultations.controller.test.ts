import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { GetConsultationByIdController } from '../rest/controllers/get-consultation-by-id.controller'
import { GetConsultationByIdUseCase } from '@hms/core/consultation/use-cases'
import { AuthGuard } from '@/identity/guards'

describe('GetConsultationByIdController (consultations.controller.test.ts)', () => {
  let controller: GetConsultationByIdController
  let getConsultationByIdUseCase: GetConsultationByIdUseCase
  let consultationsRepositoryMock: {
    findById: ReturnType<typeof vi.fn>
    findByAppointmentId: ReturnType<typeof vi.fn>
    updateClientQualification: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
  }

  const mockConsultationDomain = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    appointmentId: null,
    clientId: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
    assignedLawyerId: '28723a68-d073-43b3-aa34-54b84d98f925',
    legalAreaId: '4a664059-7f45-435f-b5b3-407d8f1652b6',
    legalTopicId: 'fd56da99-08c5-4adb-b153-217872297b08',
    status: 'completed',
    modality: 'PRESENTIAL',
    assignedLawyer: {
      id: '28723a68-d073-43b3-aa34-54b84d98f925',
      name: 'Advogado de desenvolvimento',
    },
    attendant: {
      id: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
      name: 'Maria Atendente',
    },
    intake: {
      id: '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
      code: 'INT-0014',
      origin: 'website',
      contactChannel: 'phone',
      responsibleId: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
      attendantName: 'Maria Atendente',
    },
    client: {
      id: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
      name: 'Morris Lemke',
      taxIdValue: '03737829420',
      hmsResponsible: 'Maria Atendente',
    },
    relevantFacts: [],
    potentialLegalRequests: [],
  }

  beforeEach(async () => {
    consultationsRepositoryMock = {
      findById: vi.fn(),
      findByAppointmentId: vi.fn(),
      updateClientQualification: vi.fn(),
      save: vi.fn(),
    }

    const moduleBuilder = Test.createTestingModule({
      controllers: [GetConsultationByIdController],
      providers: [
        {
          provide: GetConsultationByIdUseCase,
          useValue: { execute: vi.fn() },
        },
        
        {
          provide: 'ConsultationsRepository',
          useValue: consultationsRepositoryMock,
        },
       
        {
          provide: 'identity:auth-provider',
          useValue: { verifyToken: vi.fn() },
        },
        {
          provide: Symbol.for('IDENTITY_REPOSITORIES.users'),
          useValue: { findById: vi.fn() },
        },
      ],
    })

    if (AuthGuard) {
      moduleBuilder.overrideGuard(AuthGuard).useValue({ canActivate: () => true })
    }

    const module: TestingModule = await moduleBuilder.compile()

    controller = module.get<GetConsultationByIdController>(GetConsultationByIdController)
    getConsultationByIdUseCase = module.get(GetConsultationByIdUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Get Consultation By ID', () => {
    it('returns consultation details when found', async () => {
      consultationsRepositoryMock.findById.mockResolvedValue(mockConsultationDomain)
      vi.spyOn(getConsultationByIdUseCase, 'execute').mockResolvedValue(
        mockConsultationDomain as any,
      )

      const result = typeof (controller as any).handle === 'function'
        ? await (controller as any).handle('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        : await (controller as any).findById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

      expect(result).toBeDefined()
    })

    it('throws NotFoundException when consultation does not exist', async () => {
      consultationsRepositoryMock.findById.mockResolvedValue(null)
      vi.spyOn(getConsultationByIdUseCase, 'execute').mockResolvedValue(null)

      const executeCall = () =>
        typeof (controller as any).handle === 'function'
          ? (controller as any).handle('invalid-id')
          : (controller as any).findById('invalid-id')

      await expect(executeCall()).rejects.toThrow(NotFoundException)
    })
  })
})