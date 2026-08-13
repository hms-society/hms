import { Icon } from '@/ui/shared/widgets/components/icon'

export interface LegalAreaOption {
  id: string
  name: string
}

export interface LegalTopicOption {
  id: string
  legalAreaId?: string
  name: string
}

interface LegalAreaSectionProps {
  legalAreaId: string
  setLegalAreaId: (id: string) => void
  legalTopicId: string
  setLegalTopicId: (id: string) => void
  areasList: LegalAreaOption[]
  topicsList: LegalTopicOption[]
  fallbackAreaName?: string
  fallbackTopicName?: string
}

export function LegalAreaSection({
  legalAreaId,
  setLegalAreaId,
  legalTopicId,
  setLegalTopicId,
  areasList,
  topicsList,
  fallbackAreaName,
  fallbackTopicName,
}: LegalAreaSectionProps) {
  const effectiveAreas = [...areasList]
  if (
    legalAreaId &&
    fallbackAreaName &&
    !effectiveAreas.some((a) => a.id === legalAreaId)
  ) {
    effectiveAreas.unshift({ id: legalAreaId, name: fallbackAreaName })
  }

  const effectiveTopics = legalAreaId
    ? topicsList.filter((t) => !t.legalAreaId || t.legalAreaId === legalAreaId)
    : [...topicsList]

  if (
    legalTopicId &&
    fallbackTopicName &&
    !effectiveTopics.some((t) => t.id === legalTopicId)
  ) {
    effectiveTopics.unshift({
      id: legalTopicId,
      legalAreaId,
      name: fallbackTopicName,
    })
  }

  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4'>
      <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
        <Icon name='tag' className='w-4 h-4 text-teal-800' /> Área e Tema
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='text-xs font-medium text-slate-700'>Área jurídica</label>
          <select
            value={legalAreaId}
            onChange={(e) => {
              const newAreaId = e.target.value
              setLegalAreaId(newAreaId)
              setLegalTopicId('')
            }}
            className='mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer'
          >
            <option value=''>Selecione uma área...</option>
            {effectiveAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='text-xs font-medium text-slate-700'>Tema jurídico</label>
          <select
            value={legalTopicId}
            onChange={(e) => setLegalTopicId(e.target.value)}
            className='mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer'
          >
            <option value=''>Selecione um tema...</option>
            {effectiveTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
