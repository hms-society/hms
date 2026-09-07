import type { Entity } from '../../../shared/domain/entities/entity'

export type ClassificacaoAcesso =
  | 'INTERNO'
  | 'CLIENTE'
  | 'RESTRITO'
  | 'CONFIDENCIAL'
  | 'PARCEIRO_LIBERADO'

export type Document = Entity & {
  title: string
  classificacaoAcesso: ClassificacaoAcesso
  currentVersionId?: string
  createdAt: Date
  updatedAt: Date
}
