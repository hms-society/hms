import { useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useDocumentFileQuery } from '@/ui/shared/hooks/use-document-file-query'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DocumentViewerPage() {
  const { fileId } = useParams({ from: '/documentos/$fileId' })
  
  const { data: file, isLoading: isLoadingFile, isError: isErrorFile } = useDocumentFileQuery(fileId)

  const { data: fileUrl, isLoading: isLoadingUrl, isError: isErrorUrl } = useQuery({
    queryKey: ['document-blob', file?.storagePath],
    queryFn: async () => {
      if (!file?.storagePath) return null
      
      const { data, error } = await supabase.storage
        .from('document_batches')
        .download(file.storagePath)
        
      if (error) {
        throw error
      }
      
      return URL.createObjectURL(data)
    },
    enabled: !!file?.storagePath,
    retry: false
  })

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  if (isLoadingFile) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Carregando visualizador...
      </div>
    )
  }

  if (isErrorFile || !file) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Erro ao carregar os metadados do arquivo.
      </div>
    )
  }

  const format = file.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  }).format(new Date(file.createdAt))

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 mt-5 px-4 sm:px-8 pb-10">
      
      <div className="flex w-full max-w-4xl flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#134C50]">Editor de validação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revise o documento, confirme o vínculo e registre a decisão final.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-pill gap-2 border-border/80 text-foreground"
          onClick={() => window.history.back()}
        >
          <Icon name="arrow-left" className="w-4 h-4" />
          Voltar aos documentos
        </Button>
      </div>

      <Card className="shadow-sm border-border overflow-hidden rounded-xl bg-card w-full max-w-4xl">
        
        <div className="flex flex-col gap-1 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-foreground">{file.originalName}</h2>
            <Badge variant="secondary" className="bg-muted text-xs font-semibold text-muted-foreground shadow-none">
              {format}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Portal do cliente • Recebido em {formattedDate}
          </span>
        </div>

        <CardContent className="p-0">
          <div className="flex flex-col bg-[#F4F4F5]">
            
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-semibold text-foreground">Documento original</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg bg-card">
                  <Icon name="zoom-in" className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg bg-card">
                  <Icon name="zoom-out" className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg bg-card"
                  onClick={() => fileUrl ? window.open(fileUrl, '_blank') : undefined}
                  disabled={!fileUrl}
                >
                  <Icon name="download" className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 px-6 min-h-[500px]">
              <div className="w-full max-w-2xl bg-white border border-border/50 shadow-sm rounded-md aspect-[1/1.4] flex items-center justify-center overflow-hidden relative">
                {isLoadingUrl ? (
                  <div className="flex flex-col items-center text-muted-foreground gap-2">
                    <Icon name="refresh-cw" className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Gerando visualização segura...</span>
                  </div>
                ) : isErrorUrl ? (
                  <div className="flex flex-col items-center text-destructive gap-2 p-8 text-center bg-destructive/5 rounded-lg border border-destructive/20">
                    <Icon name="triangle-alert" className="w-8 h-8" />
                    <span className="text-sm font-medium">O arquivo físico não foi encontrado no Storage ou o acesso foi negado pela política RLS.</span>
                  </div>
                ) : !fileUrl ? (
                  <div className="flex flex-col items-center text-muted-foreground gap-2">
                    <Icon name="triangle-alert" className="w-8 h-8" />
                    <span className="text-sm">Não foi possível carregar a URL do arquivo.</span>
                  </div>
                ) : format === 'PDF' ? (
                  <iframe
                    src={`${fileUrl}#toolbar=0&navpanes=0`}
                    className="absolute inset-0 w-full h-full border-none bg-white"
                    title={file.originalName}
                  />
                ) : ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(format) ? (
                  <img
                    src={fileUrl}
                    alt={file.originalName}
                    className="absolute inset-0 w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground p-8 text-center">
                    <Icon name="file-text" className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-sm">O formato {format} não possui visualizador web nativo.</p>
                    <p className="text-xs mt-1">Utilize o botão de download para abri-lo localmente.</p>
                  </div>
                )}
              </div>

              {format === 'PDF' && !isErrorUrl && (
                <Badge variant="outline" className="mt-4 bg-white text-muted-foreground px-3 py-1 shadow-sm font-medium">
                  Modo de Leitura
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-card/50">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Arquivo</span>
                <span className="text-xs font-semibold text-foreground">
                  {format} - {formatBytes(file.sizeBytes)}
                </span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}