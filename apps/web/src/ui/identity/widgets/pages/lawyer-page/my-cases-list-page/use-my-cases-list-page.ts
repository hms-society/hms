import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { LawyerCaseViewItem } from './types'

const STATUS_STYLES = {
  'Em formação': 'bg-accent text-accent-foreground hover:bg-accent',
  'Em andamento': 'bg-highlight text-highlight-foreground hover:bg-highlight',
  'Aguardando cliente': 'bg-highlight text-highlight-foreground hover:bg-highlight',
  'Em produção jurídica': 'bg-secondary text-secondary-foreground hover:bg-secondary',
  'Protocolo e entrega': 'bg-muted text-foreground hover:bg-muted',
  Execução: 'bg-accent text-accent-foreground hover:bg-accent',
  Encerrado: 'bg-muted text-muted-foreground hover:bg-muted',
} as const

const STATUS_LABELS = {
  [LegalCaseStatus.Documentation]: 'Em formação',
  [LegalCaseStatus.ReadyForLegalProduction]: 'Em andamento',
  [LegalCaseStatus.LegalProduction]: 'Em produção jurídica',
  [LegalCaseStatus.ProtocolDelivery]: 'Protocolo e entrega',
  [LegalCaseStatus.Execution]: 'Execução',
  [LegalCaseStatus.Closed]: 'Encerrado',
} as const satisfies Record<LegalCaseStatus, keyof typeof STATUS_STYLES>

export function useMyCasesListPage() {
  const { caseManagementService } = useRestContext()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')
  const [area, setArea] = useState('todas')
  const {
    data,
    isError: isCasesError,
    isLoading: isLoadingCases,
  } = useQuery({
    queryKey: ['case-management', 'my-cases'],
    queryFn: async () => {
      const response = await caseManagementService.listMyCases()
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  const visibleCases = useMemo(() => {
    return (data ?? [])
      .filter((caseItem) => {
        const statusLabel = STATUS_LABELS[caseItem.status] ?? 'Em formação'

        const normalizedSearch = search.trim().toLowerCase()
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [
            caseItem.title,
            caseItem.clientName,
            caseItem.publicCode,
            caseItem.legalArea,
            caseItem.legalTopic,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))

        const matchesStatus = status === 'todos' || statusLabel === status
        const matchesArea = area === 'todas' || caseItem.legalArea === area

        return matchesSearch && matchesStatus && matchesArea
      })
      .map((caseItem): LawyerCaseViewItem => {
        const statusLabel = STATUS_LABELS[caseItem.status] ?? 'Em formação'

        return {
          id: caseItem.id,
          title: caseItem.title,
          clientName: caseItem.clientName,
          publicCode: caseItem.publicCode,
          legalArea: caseItem.legalArea,
          status: statusLabel,
          priority: 'Normal',
          nextAction:
            caseItem.status === LegalCaseStatus.ReadyForLegalProduction
              ? 'Homologar dossiê documental'
              : 'Revisar checklist de documentos',
          updatedAt: formatUpdatedAt(caseItem.updatedAt),
          team: caseItem.team.map((member, index) => ({
            collaboratorId: member.collaboratorId,
            initials: getInitials(member.name),
            name: member.name,
            role: member.role,
            className: getTeamMemberClassName(index),
          })),
          progress: {
            completedCount: 0,
            totalCount: 7,
            icon: 'file-text',
          },
          displayTeam: caseItem.team.map((member) => member.name).join(', '),
          statusStyle: STATUS_STYLES[statusLabel],
        }
      })
  }, [area, data, search, status])

  const total = visibleCases.length

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
  }

  function handleAreaChange(value: string) {
    setArea(value)
  }

  return {
    area,
    cases: visibleCases,
    handleAreaChange,
    handleSearchChange,
    handleStatusChange,
    isCasesError,
    isLoadingCases,
    search,
    status,
    total,
  }
}

function formatUpdatedAt(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getTeamMemberClassName(index: number) {
  const classes = [
    'bg-primary text-primary-foreground',
    'bg-accent text-accent-foreground',
    'bg-highlight text-highlight-foreground',
    'bg-muted text-foreground',
  ]

  return classes[index % classes.length] ?? classes[0]
}
