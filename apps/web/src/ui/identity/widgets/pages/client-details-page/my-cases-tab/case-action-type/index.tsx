export type CaseActionTypeProps = {
  areaId?: string
}

export const CaseActionType = ({ areaId }: CaseActionTypeProps) => {
  if (!areaId) return <>Petição Inicial / Cível</>

  const normalizedAreaId = areaId.toLowerCase()

  if (normalizedAreaId.includes('civel') || normalizedAreaId.includes('civ')) {
    return <>Ação Ordinária</>
  }

  if (normalizedAreaId.includes('trabalho') || normalizedAreaId.includes('tra')) {
    return <>Reclamação Trabalhista</>
  }

  if (normalizedAreaId.includes('familia') || normalizedAreaId.includes('fam')) {
    return <>Ação de Divórcio</>
  }

  return <>Petição Inicial / Cível</>
}
