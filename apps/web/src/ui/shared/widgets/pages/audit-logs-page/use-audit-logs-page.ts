import type {
  AuditEvent,
  AuditEventEntityType,
  AuditEventOrigin,
  AuditEventStatus,
} from '@hms/core/shared/domain/structures'
import { useState } from 'react'

import { useAuditLogDetailsQuery } from '@/ui/shared/hooks/use-audit-log-details-query'
import { useAuditLogsQuery } from '@/ui/shared/hooks/use-audit-logs-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const PAGE_SIZE = 20

export function useAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState<AuditEventEntityType | ''>('')
  const [origin, setOrigin] = useState<AuditEventOrigin | ''>('')
  const [status, setStatus] = useState<AuditEventStatus | ''>('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string>()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<Error | null>(null)
  const { auditLogsService } = useRestContext()
  const request = {
    page,
    limit: PAGE_SIZE,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    entityType: entityType || undefined,
    origin: origin || undefined,
    status: status || undefined,
  }
  const { auditLogs, totalAuditLogs, auditLogsError, isLoadingAuditLogs, refetch } =
    useAuditLogsQuery(request)
  const { auditLog, auditLogError, isLoadingAuditLog } =
    useAuditLogDetailsQuery(selectedAuditLogId)

  function resetPage() {
    setPage(1)
  }

  function handleEntityTypeChange(value: AuditEventEntityType | '') {
    setEntityType(value)
    resetPage()
  }

  function handleOriginChange(value: AuditEventOrigin | '') {
    setOrigin(value)
    resetPage()
  }

  function handleStatusChange(value: AuditEventStatus | '') {
    setStatus(value)
    resetPage()
  }

  function handleActionChange(value: string) {
    setAction(value)
    resetPage()
  }

  function handleFromChange(value: string) {
    setFrom(value)
    resetPage()
  }

  function handleToChange(value: string) {
    setTo(value)
    resetPage()
  }

  async function handleExport(format: 'csv' | 'json') {
    setIsExporting(true)
    setExportError(null)
    try {
      const response = await auditLogsService.export({ ...request, format })
      if (response.isFailure) response.throwError()
      const url = URL.createObjectURL(response.body)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(error instanceof Error ? error : new Error('Export failed'))
    } finally {
      setIsExporting(false)
    }
  }

  function handleEventExport(format: 'csv' | 'json', event: AuditEvent) {
    const content =
      format === 'json'
        ? JSON.stringify(event, null, 2)
        : [
            'id,occurredAt,actorId,actorProfile,entityType,entityId,action,origin,status',
            [
              event.id,
              new Date(event.occurredAt).toISOString(),
              event.actorId ?? '',
              event.actorProfile ?? '',
              event.entityType,
              event.entityId ?? '',
              event.action,
              event.origin ?? '',
              event.status,
            ]
              .map((value) => {
                const normalized = String(value)
                return /[",\n]/.test(normalized)
                  ? `"${normalized.replaceAll('"', '""')}"`
                  : normalized
              })
              .join(','),
          ].join('\n')
    const contentType = format === 'json' ? 'application/json' : 'text/csv'
    const url = URL.createObjectURL(new Blob([content], { type: contentType }))
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${event.id}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  function formatTechnicalLabel(value: string) {
    return value
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (character) => character.toLocaleUpperCase())
  }

  function getEntityLabel(value: string) {
    const labels: Record<string, string> = {
      intake: 'Intake',
      case: 'Caso',
      document: 'Documento',
      piece: 'Peça',
      checklist: 'Checklist',
      task: 'Tarefa',
      deadline: 'Prazo',
      permission: 'Permissão',
      client: 'Cliente',
      third_party: 'Terceiro',
      external_access: 'Acesso externo',
      document_validation: 'Validação documental',
      document_exception: 'Exceção documental',
      audit_log_export: 'Exportação de auditoria',
    }

    return labels[value] ?? formatTechnicalLabel(value)
  }

  function getActionLabel(value: string) {
    const labels: Record<string, string> = {
      created: 'Criado',
      updated: 'Atualizado',
      deleted: 'Excluído',
      validated: 'Validado',
      rejected: 'Rejeitado',
      requested: 'Solicitado',
      revoked: 'Revogado',
      exported: 'Exportado',
      granted: 'Concedido',
      permission_granted: 'Permissão concedida',
      permission_revoked: 'Permissão revogada',
      metadata_captured: 'Metadados capturados',
      decision_recorded: 'Decisão registrada',
      ai_correction_recorded: 'Correção por IA registrada',
      resend_requested: 'Reenvio solicitado',
      REQUESTED: 'Solicitado',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      EXPIRED: 'Expirado',
      processing_failure: 'Falha no processamento',
      deactivated: 'Inativado',
      reactivated: 'Reativado',
    }

    return labels[value] ?? formatTechnicalLabel(value)
  }

  function getOriginLabel(value: string | undefined) {
    const labels: Record<string, string> = {
      human: 'Humano',
      system: 'Sistema',
      ai: 'IA',
      integration: 'Integração',
    }

    return value ? (labels[value] ?? formatTechnicalLabel(value)) : '—'
  }

  const filteredAuditLogs = (() => {
    const normalizedSearch = action.trim().toLocaleLowerCase()
    if (!normalizedSearch) return auditLogs

    return auditLogs.filter((event) =>
      [
        event.action,
        getActionLabel(event.action),
        event.entityType,
        getEntityLabel(event.entityType),
        event.actorId,
        event.actorProfile,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch)),
    )
  })()

  return {
    action,
    auditLog,
    auditLogError,
    auditLogs: filteredAuditLogs,
    auditLogsError,
    entityType,
    handleActionChange,
    handleEntityTypeChange,
    handleExport,
    handleEventExport,
    handleFromChange,
    handleOriginChange,
    handleStatusChange,
    handleToChange,
    getActionLabel,
    getEntityLabel,
    getOriginLabel,
    isLoadingAuditLog,
    isLoadingAuditLogs,
    isExporting,
    exportError,
    page,
    refetch,
    selectedAuditLogId,
    setPage,
    setSelectedAuditLogId,
    origin,
    from,
    status,
    to,
    totalAuditLogs,
    totalPages: Math.max(1, Math.ceil(totalAuditLogs / PAGE_SIZE)),
  }
}
