import type { Formalization } from '../domain/entities'
import type { CloseFormalizationRequest } from './close-formalization-request'

export interface FormalizationIntakeClosureService {
  /**
   * Atomically closes the Intake and cancels the Formalization with both CAS versions.
   * Implementations must leave both aggregates unchanged when either CAS fails and
   * return the existing cancellation when a retry is already converged.
   */
  closeWithoutContract(request: CloseFormalizationRequest): Promise<Formalization>
}
