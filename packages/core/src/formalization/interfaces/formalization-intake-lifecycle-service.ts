import type { Formalization } from '../domain/entities'
import type { StartFormalizationRequest } from './start-formalization-request'

export interface FormalizationIntakeLifecycleService {
  /**
   * Atomically creates or gets the Formalization and applies the Intake CAS.
   * Implementations must leave both aggregates unchanged when the CAS fails.
   */
  startFormalization(request: StartFormalizationRequest): Promise<Formalization>
}
