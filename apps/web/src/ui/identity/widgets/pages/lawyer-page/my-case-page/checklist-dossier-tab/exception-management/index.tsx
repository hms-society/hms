import type { ChecklistDossierController } from '../types'
import { ExceptionsSection } from '../exceptions-section'
import { ExceptionDialogs } from '../exception-dialogs'

export type ExceptionManagementProps = {
  controller: ChecklistDossierController
  readOnly: boolean
}

export const ExceptionManagement = ({
  controller,
  readOnly,
}: ExceptionManagementProps) => (
  <>
    <ExceptionsSection controller={controller} readOnly={readOnly} />
    <ExceptionDialogs controller={controller} readOnly={readOnly} />
  </>
)
