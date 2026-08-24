import { Icon } from '@/ui/shared/widgets/components/icon'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type LegalAreaOption = {
  id: string
  name: string
}

export type LegalTopicOption = {
  id: string
  legalAreaId?: string
  name: string
}

export type LegalAreaSectionProps = {
  legalAreaId: string
  setLegalAreaId: (id: string) => void
  legalTopicId: string
  setLegalTopicId: (id: string) => void
  areasList: LegalAreaOption[]
  topicsList: LegalTopicOption[]
  fallbackAreaName?: string
  fallbackTopicName?: string
  isReadOnly?: boolean
}

export const LegalAreaSection = ({
  legalAreaId,
  setLegalAreaId,
  legalTopicId,
  setLegalTopicId,
  areasList,
  topicsList,
  fallbackAreaName,
  fallbackTopicName,
  isReadOnly = false,
}: LegalAreaSectionProps) => {
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
    <CollapsibleCard
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='tag' className='w-4 h-4 text-teal-800' /> Área e Tema
        </h2>
      }
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label htmlFor='legal-area' className='text-xs font-medium text-slate-700'>
            Área jurídica
          </label>
          <Select
            value={legalAreaId}
            onValueChange={setLegalAreaId}
            disabled={isReadOnly}
          >
            <SelectTrigger
              id='legal-area'
              className='mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700'
              size='sm'
            >
              <SelectValue placeholder='Selecione uma área...' />
            </SelectTrigger>
            <SelectContent>
              {effectiveAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor='legal-topic' className='text-xs font-medium text-slate-700'>
            Tema jurídico
          </label>
          <Select
            value={legalTopicId}
            onValueChange={setLegalTopicId}
            disabled={isReadOnly}
          >
            <SelectTrigger
              id='legal-topic'
              className='mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700'
              size='sm'
            >
              <SelectValue placeholder='Selecione um tema...' />
            </SelectTrigger>
            <SelectContent>
              {effectiveTopics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleCard>
  )
}
