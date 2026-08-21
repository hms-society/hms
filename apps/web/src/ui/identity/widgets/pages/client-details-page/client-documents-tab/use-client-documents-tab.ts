import { useClientDocumentsQuery } from '@/ui/identity/hooks/use-client-documents-query'

export type ClientDocumentsTabProps = {
  clientId: string
}

export function useClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const { data: batches = [], isLoading, isError } = useClientDocumentsQuery(clientId)

  return { batches, isError, isLoading }
}
