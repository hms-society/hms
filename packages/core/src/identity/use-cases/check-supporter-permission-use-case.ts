import type {
  SupportersRepository,
  ClientSupporter,
} from '../interfaces/supporters-repository'

export type CheckSupporterPermissionRequest = {
  phone: string
}

export type CheckSupporterPermissionResponse = {
  isSupporter: boolean
  supporter?: ClientSupporter
}

export class CheckSupporterPermissionUseCase {
  constructor(private readonly supportersRepository: SupportersRepository) {}

  async execute(
    request: CheckSupporterPermissionRequest,
  ): Promise<CheckSupporterPermissionResponse> {
    const supporters = await this.supportersRepository.findByPhone(request.phone)
    const activeSupporter = supporters.find((s) => s.isActive)

    if (activeSupporter) {
      return {
        isSupporter: true,
        supporter: activeSupporter,
      }
    }

    return {
      isSupporter: false,
    }
  }
}
