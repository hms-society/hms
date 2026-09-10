import type { LegalArea } from '../types'

export const checklistTemplatesMock: LegalArea[] = [
  {
    id: 'trabalhista',
    name: 'Trabalhista',
    documents: [
      {
        id: 'trab-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trab-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trab-3',
        name: 'Comprovante de Vínculo Empregatício',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trab-4',
        name: 'Extrato do CNIS/INSS',
        type: 'PDF',
        required: false,
      },
      {
        id: 'trab-5',
        name: 'Laudos Médicos/Periciais',
        type: 'ANY',
        required: true,
      },
      {
        id: 'trab-6',
        name: 'Declaração de Hipossuficiência',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trab-7',
        name: 'CTPS (Carteira de Trabalho)',
        type: 'PDF',
        required: true,
      },
    ],
  },
  {
    id: 'previdenciario',
    name: 'Previdenciário',
    documents: [
      {
        id: 'prev-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'prev-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'prev-3',
        name: 'Comprovante de Vínculo Empregatício',
        type: 'PDF',
        required: true,
      },
      {
        id: 'prev-4',
        name: 'Extrato do CNIS/INSS',
        type: 'PDF',
        required: false,
      },
      {
        id: 'prev-5',
        name: 'Laudos Médicos/Periciais',
        type: 'ANY',
        required: true,
      },
      {
        id: 'prev-6',
        name: 'Declaração de Hipossuficiência',
        type: 'PDF',
        required: true,
      },
      {
        id: 'prev-7',
        name: 'CTPS (Carteira de Trabalho)',
        type: 'PDF',
        required: true,
      },
      {
        id: 'prev-8',
        name: 'Certidão de Tempo de Contribuição',
        type: 'PDF',
        required: false,
      },
      {
        id: 'prev-9',
        name: 'Comprovante de Residência Atualizado',
        type: 'ANY',
        required: true,
      },
    ],
  },
  {
    id: 'familia-sucessoes',
    name: 'Família e Sucessões',
    documents: [
      {
        id: 'fam-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'fam-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'fam-3',
        name: 'Certidão de Nascimento ou Casamento',
        type: 'ANY',
        required: true,
      },
      {
        id: 'fam-4',
        name: 'Comprovante de Residência Atualizado',
        type: 'ANY',
        required: true,
      },
      {
        id: 'fam-5',
        name: 'Documentos Patrimoniais',
        type: 'ANY',
        required: false,
      },
      {
        id: 'fam-6',
        name: 'Declaração de Hipossuficiência',
        type: 'PDF',
        required: false,
      },
    ],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    documents: [
      {
        id: 'criminal-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'criminal-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'criminal-3',
        name: 'Documentos do Processo',
        type: 'ANY',
        required: true,
      },
    ],
  },
  {
    id: 'tributario',
    name: 'Tributário',
    documents: [
      {
        id: 'trib-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trib-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'trib-3',
        name: 'Documentos Fiscais',
        type: 'ANY',
        required: true,
      },
      {
        id: 'trib-4',
        name: 'Comprovante de Residência Atualizado',
        type: 'ANY',
        required: false,
      },
    ],
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    documents: [
      {
        id: 'adm-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'adm-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
    ],
  },
  {
    id: 'consumidor',
    name: 'Consumidor',
    documents: [
      {
        id: 'cons-1',
        name: 'Procuração Assinada',
        type: 'PDF',
        required: true,
      },
      {
        id: 'cons-2',
        name: 'Documento de Identificação Oficial',
        type: 'PDF',
        required: true,
      },
      {
        id: 'cons-3',
        name: 'Comprovante da Relação de Consumo',
        type: 'ANY',
        required: true,
      },
    ],
  },
]
