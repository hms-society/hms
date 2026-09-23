export type CasePieceVersion = {
  id: string
  label: string
  title: string
  author: string
  timestamp: string
  meta?: string
}

export type CasePiece = {
  id: string
  title: string
  template: string
  author: string
  reviewer: string
  updatedAt: string
  status: 'Em revisão técnica' | 'Aprovada'
  versions: CasePieceVersion[]
}
