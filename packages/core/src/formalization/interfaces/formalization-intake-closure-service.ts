import type { Intake } from '../../intake/domain/entities'
import type { CloseFormalizationIntakeRequest } from './close-formalization-intake-request'

export interface FormalizationIntakeClosureService {
  closeWithoutContract(request: CloseFormalizationIntakeRequest): Promise<Intake>
}
