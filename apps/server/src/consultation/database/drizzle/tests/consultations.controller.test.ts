import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { ConsultationsController } from '../rest/controllers/consultations-controller'
import {
  CreateConsultationUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
  RegisterNoShowUseCase,
  GetConsultationByIdUseCase,
} from '@hms/core/consultation/use-cases'
import { DrizzleConsultationsRepository } from '../repository/drizzle-consultations-repository'

describe('ConsultationsController', () => {
  let controller: ConsultationsController
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultationsController],
      providers: [
        {
          provide: CreateConsultationUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: StartConsultationUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: CompleteConsultationUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: RegisterNoShowUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: GetConsultationByIdUseCase,
          useValue: { execute: vi.fn() },
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
    }).compile()

    controller = module.get<ConsultationsController>(ConsultationsController)
    getConsultationByIdUseCase = module.get(GetConsultationByIdUseCase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('returns consultation details with resolved attendant information when found', async () => {
      vi.spyOn(getConsultationByIdUseCase, 'execute').mockResolvedValue(
        mockConsultationDomain as any,
      )

      const result = (await controller.findById(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      )) as any

      expect(getConsultationByIdUseCase.execute).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      )
      expect(result).toBeDefined()
      expect(result.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      expect(result.attendant?.name).toBe('Maria Atendente')
      expect(result.intake?.attendantName).toBe('Maria Atendente')
    })

    it('throws NotFoundException when consultation does not exist', async () => {
      vi.spyOn(getConsultationByIdUseCase, 'execute').mockResolvedValue(null)

      await expect(controller.findById('invalid-id')).rejects.toThrow(NotFoundException)
      expect(getConsultationByIdUseCase.execute).toHaveBeenCalledWith('invalid-id')
    })
  })

  describe('updateQualification', () => {
    it('delegates client qualification update to repository', async () => {
      const clientId = 'a97f1adf-335c-4ea8-817b-09e7f8446b3d'
      const dto: any = {
        name: 'Morris Lemke',
        taxIdValue: '03737829420',
        phone: '1-924-844-6535',
        email: 'Austen.Lebsack@yahoo.com',
        hmsResponsible: 'Maria Atendente',
      }

      consultationsRepositoryMock.findById.mockResolvedValue(mockConsultationDomain)
      consultationsRepositoryMock.updateClientQualification.mockResolvedValue(undefined)

      await expect(controller.updateQualification(clientId, dto)).resolves.not.toThrow()

      expect(consultationsRepositoryMock.updateClientQualification).toHaveBeenCalledWith(
        clientId,
        dto,
      )
    })
  })
})
