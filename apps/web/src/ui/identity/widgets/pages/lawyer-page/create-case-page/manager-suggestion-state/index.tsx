export type ManagerSuggestionStateProps = {
  isLoading: boolean
  error: unknown
  isSuggested: boolean
}

export const ManagerSuggestionState = ({
  isLoading,
  error,
  isSuggested,
}: ManagerSuggestionStateProps) => {
  if (isLoading)
    return (
      <p className='mt-2 text-xs text-muted-foreground' aria-live='polite'>
        Buscando sugestão da triagem…
      </p>
    )
  if (error)
    return (
      <p className='mt-2 text-xs text-muted-foreground' role='status'>
        Não foi possível carregar a sugestão. Selecione o gestor manualmente.
      </p>
    )
  if (isSuggested)
    return (
      <p className='mt-2 text-xs text-muted-foreground'>
        Sugerido com base no advogado responsável pela triagem.
      </p>
    )
  return null
}
