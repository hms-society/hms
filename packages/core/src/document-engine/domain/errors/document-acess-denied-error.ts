export class DocumentAccessDeniedError extends Error {
  constructor(message: string = 'Você não tem permissão para acessar este documento.') {
    super(message)
    this.name = 'DocumentAccessDeniedError'
  }
}