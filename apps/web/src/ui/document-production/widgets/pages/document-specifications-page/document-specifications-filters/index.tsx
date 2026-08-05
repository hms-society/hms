import type { LegalArea, LegalTopic } from '@hms/core/legal-catalog/domain/entities'
import type {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { Input } from '@/ui/shadcn/input'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentSpecificationsFilterSelect } from '../document-specifications-filter-select'
import type { DocumentSpecificationsSearchParams } from '../document-specifications-page-search'

const moments: Array<[DocumentGenerationMoment, string]> = [
  ['consultation', 'Consulta'],
  ['formalization', 'Formalização'],
  ['legal_production', 'Produção jurídica'],
]
const statuses: Array<[DocumentSpecificationStatus, string]> = [
  ['available', 'Disponível'],
  ['unavailable', 'Indisponível'],
]

export type DocumentSpecificationsFiltersProps = {
  params: DocumentSpecificationsSearchParams
  areas: readonly LegalArea[]
  topics: readonly LegalTopic[]
  areasLoading: boolean
  topicsLoading: boolean
  areasError: boolean
  topicsError: boolean
  onSearch: (value: string) => void
  onArea: (value: string | null) => void
  onChange: (patch: Partial<DocumentSpecificationsSearchParams>) => void
  onClear: () => void
}

export const DocumentSpecificationsFilters = ({
  params,
  areas,
  topics,
  areasLoading,
  topicsLoading,
  areasError,
  topicsError,
  onSearch,
  onArea,
  onChange,
  onClear,
}: DocumentSpecificationsFiltersProps) => (
  <section
    aria-label='Filtros de modelos de documentos'
    className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4'
  >
    <div className='flex items-center justify-between gap-3'>
      <span className='text-xs font-semibold'>Filtros</span>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        aria-label='Limpar filtros'
        onClick={onClear}
        className='h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground'
      >
        <Icon name='x' />
        Limpar filtros
      </Button>
    </div>
    {(areasError || (topicsError && Boolean(params.legalAreaId))) && (
      <p role='alert' className='col-span-full text-sm text-destructive'>
        As opções de aplicação estão indisponíveis no momento. Você ainda pode consultar a
        tabela e tentar novamente mais tarde.
      </p>
    )}
    <div className='space-y-1.5'>
      <label htmlFor='document-specifications-search' className='text-[11px] font-bold'>
        Buscar
      </label>
      <div className='relative'>
        <Icon
          name='search'
          className='pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted-foreground'
        />
        <Input
          id='document-specifications-search'
          aria-label='Buscar modelo'
          value={params.search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder='Nome ou descrição do modelo'
          className='h-9 rounded-md pl-9 text-xs'
        />
      </div>
    </div>
    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
      <DocumentSpecificationsFilterSelect
        label='Área jurídica'
        value={params.legalAreaId}
        placeholder={areasLoading ? 'Carregando áreas…' : 'Todas as áreas'}
        options={areas.map((item) => ({ value: item.id, label: item.name }))}
        onChange={onArea}
      />
      <DocumentSpecificationsFilterSelect
        label='Tema jurídico'
        value={params.legalTopicId}
        placeholder={topicsLoading ? 'Carregando temas…' : 'Todos os temas'}
        options={topics.map((item) => ({ value: item.id, label: item.name }))}
        disabled={!params.legalAreaId || topicsLoading}
        onChange={(value) => onChange({ legalTopicId: value, page: 1 })}
      />
      <DocumentSpecificationsFilterSelect
        label='Momento'
        value={params.moment}
        placeholder='Todos os momentos'
        options={moments.map(([value, label]) => ({ value, label }))}
        onChange={(value) =>
          onChange({ moment: value as DocumentGenerationMoment | null, page: 1 })
        }
      />
      <DocumentSpecificationsFilterSelect
        label='Estado'
        value={params.status}
        placeholder='Todos os estados'
        options={statuses.map(([value, label]) => ({ value, label }))}
        onChange={(value) =>
          onChange({ status: value as DocumentSpecificationStatus | null, page: 1 })
        }
      />
    </div>
  </section>
)
