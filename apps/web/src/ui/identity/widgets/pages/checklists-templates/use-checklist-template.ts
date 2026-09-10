import { useMemo, useState } from 'react'
import type {
  ChecklistDocument,
  DocumentFileType,
  LegalArea,
} from './types'

const MOCK_LEGAL_AREAS: LegalArea[] = [
  {
    id: 'trabalhista',
    name: 'Trabalhista',
    documentCount: 7,
  },
  {
    id: 'previdenciario',
    name: 'Previdenciário',
    documentCount: 9,
  },
  {
    id: 'familia-sucessoes',
    name: 'Família e Sucessões',
    documentCount: 6,
  },
  {
    id: 'criminal',
    name: 'Criminal',
    documentCount: 3,
  },
  {
    id: 'tributario',
    name: 'Tributário',
    documentCount: 4,
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    documentCount: 2,
  },
  {
    id: 'consumidor',
    name: 'Consumidor',
    documentCount: 3,
  },
]

const MOCK_DOCUMENTS: Record<string, ChecklistDocument[]> = {
  trabalhista: [],
  previdenciario: [
    {
      id: '1',
      name: 'Procuração Assinada',
      type: 'PDF',
      required: true,
    },
    {
      id: '2',
      name: 'Documento de Identificação Oficial',
      type: 'PDF',
      required: true,
    },
    {
      id: '3',
      name: 'Comprovante de Vínculo Empregatício',
      type: 'PDF',
      required: true,
    },
    {
      id: '4',
      name: 'Extrato do CNIS/INSS',
      type: 'PDF',
      required: false,
    },
    {
      id: '5',
      name: 'Laudos Médicos/Periciais',
      type: 'Qualquer',
      required: true,
    },
    {
      id: '6',
      name: 'Declaração de Hipossuficiência',
      type: 'PDF',
      required: true,
    },
    {
      id: '7',
      name: 'CTPS (Carteira de Trabalho)',
      type: 'PDF',
      required: true,
    },
    {
      id: '8',
      name: 'Certidão de Tempo de Contribuição',
      type: 'PDF',
      required: false,
    },
    {
      id: '9',
      name: 'Comprovante de Residência Atualizado',
      type: 'Qualquer',
      required: true,
    },
  ],
  'familia-sucessoes': [],
  criminal: [],
  tributario: [],
  administrativo: [],
  consumidor: [],
}

export function useChecklistsTemplates() {
  const [areas] = useState(MOCK_LEGAL_AREAS)
  const [activeAreaId, setActiveAreaId] = useState('previdenciario')
  const [documentsByArea, setDocumentsByArea] =
    useState(MOCK_DOCUMENTS)
  const [search, setSearch] = useState('')

  const activeArea = areas.find(
    (area) => area.id === activeAreaId,
  )

  const documents = useMemo(() => {
    const areaDocuments =
      documentsByArea[activeAreaId] ?? []

    if (!search.trim()) {
      return areaDocuments
    }

    const normalizedSearch = search
      .toLowerCase()
      .trim()

    return areaDocuments.filter((document) =>
      document.name
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [activeAreaId, documentsByArea, search])

  function toggleRequired(documentId: string) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].map(
        (document) =>
          document.id === documentId
            ? {
                ...document,
                required: !document.required,
              }
            : document,
      ),
    }))
  }

  function changeDocumentType(
    documentId: string,
    type: DocumentFileType,
  ) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].map(
        (document) =>
          document.id === documentId
            ? {
                ...document,
                type,
              }
            : document,
      ),
    }))
  }

  function removeDocument(documentId: string) {
    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: current[activeAreaId].filter(
        (document) => document.id !== documentId,
      ),
    }))
  }

  function addDocument(
    name: string,
    type: DocumentFileType,
    required: boolean,
  ) {
    const document: ChecklistDocument = {
      id: crypto.randomUUID(),
      name,
      type,
      required,
    }

    setDocumentsByArea((current) => ({
      ...current,
      [activeAreaId]: [
        ...(current[activeAreaId] ?? []),
        document,
      ],
    }))
  }

  function saveTemplate() {
    // Comportamento visual de salvamento será implementado depois.
  }

  return {
    areas,
    activeArea,
    activeAreaId,
    documents,
    search,
    setSearch,
    setActiveAreaId,
    toggleRequired,
    changeDocumentType,
    removeDocument,
    addDocument,
    saveTemplate,
  }
}
