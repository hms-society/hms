import { useMemo, useState } from 'react'

import { LAWYER_CASES } from './cases-list-data'
import type { LawyerCaseListItem, LawyerCaseViewItem } from './types'

const STATUS_STYLES = {
  'Em formação': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'Em andamento': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  'Aguardando cliente': 'bg-highlight text-highlight-foreground hover:bg-highlight',
} as const

const CURRENT_LAWYER_COLLABORATOR_ID = 'collab-ricardo-mendes'

export function useMyCasesListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')
  const [area, setArea] = useState('todas')

  const visibleCases = useMemo(() => {
    return LAWYER_CASES.filter((caseItem) => {
      if (!canDisplayCaseForCurrentLawyer(caseItem)) return false

      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          caseItem.title,
          caseItem.clientName,
          caseItem.publicCode,
          caseItem.legalArea,
        ].some((value) => value.toLowerCase().includes(normalizedSearch))

      const matchesStatus = status === 'todos' || caseItem.status === status
      const matchesArea = area === 'todas' || caseItem.legalArea === area

      return matchesSearch && matchesStatus && matchesArea
    }).map((caseItem): LawyerCaseViewItem => {
      return {
        ...caseItem,
        displayTeam: caseItem.team.map((member) => member.name).join(', '),
        statusStyle: STATUS_STYLES[caseItem.status],
      }
    })
  }, [area, search, status])

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
    search,
    status,
    total,
  }
}

// Pending product decision: replace this placeholder with server-backed authorization
// when access must hide case X from lawyers who are not members of that case team.
function canDisplayCaseForCurrentLawyer(caseItem: LawyerCaseListItem) {
  return caseItem.team.some(
    (member) => member.collaboratorId === CURRENT_LAWYER_COLLABORATOR_ID,
  )
}
