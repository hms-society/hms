import type { DocumentTemplateVariable } from './document-template-variable'

export const SYSTEM_DOCUMENT_TEMPLATE_VARIABLES: readonly DocumentTemplateVariable[] = [
  {
    label: 'Nome do cliente',
    technicalName: 'cliente_nome',
    description: 'Nome completo do cliente.',
  },
  {
    label: 'CPF do cliente',
    technicalName: 'cliente_cpf',
    description: 'CPF do cliente.',
  },
  {
    label: 'Área jurídica',
    technicalName: 'area_juridica',
    description: 'Área jurídica associada ao atendimento.',
  },
  {
    label: 'Tema jurídico',
    technicalName: 'tema_juridico',
    description: 'Tema jurídico associado ao atendimento.',
  },
  {
    label: 'Valor dos honorários',
    technicalName: 'valor_honorarios',
    description: 'Valor dos honorários do atendimento.',
  },
] as const
