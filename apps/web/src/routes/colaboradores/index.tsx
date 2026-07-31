import { createFileRoute } from '@tanstack/react-router'
import {
  CollaboratorProfile,
  UserStatus,
  type CollaboratorListQuery,
} from '@hms/core/identity/domain/structures'
import { useState } from 'react'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { CollaboratorsPage } from '@/ui/identity/widgets/pages/collaborators-page'
import { CollaboratorRegisterDialog } from '@/ui/identity/widgets/components/collaborator-register-dialog'

function parseOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function parseOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseProfile(value: unknown): CollaboratorListQuery['profile'] {
  return typeof value === 'string' &&
    Object.values(CollaboratorProfile).includes(value as never)
    ? (value as CollaboratorListQuery['profile'])
    : undefined
}

function parseStatus(value: unknown): CollaboratorListQuery['status'] {
  return typeof value === 'string' && Object.values(UserStatus).includes(value as never)
    ? (value as CollaboratorListQuery['status'])
    : undefined
}

export const Route = createFileRoute('/colaboradores/')({
  beforeLoad: requireAdminMiddleware,
  component: CollaboratorsRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CollaboratorListQuery => ({
    search: parseOptionalString(search.search),
    profile: parseProfile(search.profile),
    jobTitle: parseOptionalString(search.jobTitle),
    status: parseStatus(search.status),
    page: parseOptionalNumber(search.page) ?? 1,
    pageSize: parseOptionalNumber(search.pageSize) ?? 20,
  }),
})

function CollaboratorsRoute() {
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>()

  return (
    <AppLayout>
      <CollaboratorsPage
        onCreateCollaborator={() => {
          setSuccessMessage(undefined)
          setIsRegisterDialogOpen(true)
        }}
        successMessage={successMessage}
      />
      <CollaboratorRegisterDialog
        open={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        onSuccess={() => setSuccessMessage('Convite pendente enviado com sucesso.')}
      />
    </AppLayout>
  )
}
