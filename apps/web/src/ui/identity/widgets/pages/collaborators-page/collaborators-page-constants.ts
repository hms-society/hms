export const COLLABORATOR_PROFILE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  attendant: 'Atendente',
  lawyer: 'Advogado',
  paralegal: 'Paralegal',
  supervisor: 'Supervisor',
}

export const COLLABORATOR_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  invited: 'Convite pendente',
  disabled: 'Desabilitado',
}

export function formatCollaboratorLastAccess(value?: Date) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Nunca acessou'
}
