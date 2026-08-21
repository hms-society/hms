import { useQuery } from '@tanstack/react-query'

import { BROWSER_ENV } from '@/constants'
import { supabaseClient } from '@/provision/auth/supabase/supabase-client'

export function useDocumentFileUrlQuery(storagePath?: string) {
  const {
    data: fileUrl,
    error: fileUrlError,
    isLoading: isLoadingFileUrl,
    isError: isErrorFileUrl,
  } = useQuery({
    queryKey: ['document-file-url', storagePath],
    queryFn: async () => {
      if (!storagePath) return null

      const { data, error } = await supabaseClient.storage
        .from(BROWSER_ENV.supabaseStorageBucket)
        .download(storagePath)

      if (error) throw error

      return URL.createObjectURL(data)
    },
    enabled: Boolean(storagePath),
    retry: false,
  })

  return { fileUrl, fileUrlError, isLoadingFileUrl, isErrorFileUrl }
}
