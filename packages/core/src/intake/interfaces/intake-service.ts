import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { Intake } from '../domain/entities'
import type {
  CloseIntakeWithoutContractUseCase,
  RegisterIntakeUseCase,
  TransitionIntakeStatusUseCase,
} from '../use-cases'

type RegisterIntakeRequest = Parameters<RegisterIntakeUseCase['execute']>[0]

type TransitionIntakeStatusRequest = Omit<
  Parameters<TransitionIntakeStatusUseCase['execute']>[0],
  'intakeId'
>

type CloseIntakeWithoutContractRequest = Omit<
  Parameters<CloseIntakeWithoutContractUseCase['execute']>[0],
  'intakeId'
>

export interface IntakeService {
  listClientIntake(clientId: string): Promise<RestResponse<Intake[]>>
  getIntake(intakeId: string): Promise<RestResponse<Intake>>
  registerIntake(request: RegisterIntakeRequest): Promise<RestResponse<Intake>>
  transitionIntakeStatus(
    intakeId: string,
    request: TransitionIntakeStatusRequest,
  ): Promise<RestResponse<Intake>>
  closeIntakeWithoutContract(
    intakeId: string,
    request: CloseIntakeWithoutContractRequest,
  ): Promise<RestResponse<Intake>>
}
