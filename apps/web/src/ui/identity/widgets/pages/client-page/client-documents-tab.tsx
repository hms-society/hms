import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useClientDocumentsQuery } from '@/ui/shared/hooks/use-client-documents-query'

type ClientDocumentsTabProps = {
  clientId: string
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const { data: batches = [], isLoading, isError } = useClientDocumentsQuery(clientId)

  if (isLoading) {
    return (
    <div className="flex justify-center items-center h-40">
        <span className="text-sm text-muted-foreground">Carregando documentos...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-sm text-destructive">Erro ao carregar os documentos.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <NativeSelect size="sm" className="w-32 bg-card">
          <NativeSelectOption value="">Canal</NativeSelectOption>
          <NativeSelectOption value="whatsapp">WhatsApp</NativeSelectOption>
          <NativeSelectOption value="upload">Upload interno</NativeSelectOption>
        </NativeSelect>
        <NativeSelect size="sm" className="w-32 bg-card">
          <NativeSelectOption value="">Status</NativeSelectOption>
          <NativeSelectOption value="validado">Validado</NativeSelectOption>
          <NativeSelectOption value="pendente">Pendente</NativeSelectOption>
        </NativeSelect>
        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-normal px-3 py-1 gap-1.5 ml-2">
          <Icon name="triangle-alert" className="w-3.5 h-3.5" /> Revisão pendente (1)
        </Badge>
      </div>

      <div className="flex flex-col gap-6">
        {batches.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground bg-card border border-border rounded-xl">
            Nenhum lote de documentos encontrado.
          </div>
        ) : (
          batches.map((batch: any) => (
            <div key={batch.id} className="flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="font-mono tracking-wide">{batch.readableId}</span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <Icon name={batch.channel === 'whatsapp' ? 'message-square' : 'arrow-up'} className="w-3.5 h-3.5" />
                    {batch.channel === 'whatsapp' ? 'WhatsApp' : 'Upload interno'}
                  </span>
                </div>
                <span>
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(batch.createdAt))}
                </span>
              </div>
              
              <div className="flex flex-col">
                {batch.files && batch.files.length > 0 ? (
                  batch.files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                          <Icon name="file-text" className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{file.originalName}</span>
                          <span className="text-xs text-muted-foreground">
                            {file.mimeType} • {(file.sizeBytes / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">
                          Recebido
                        </Badge>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                          <Icon name="eye" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-4 text-xs text-muted-foreground text-center">Nenhum arquivo processado neste lote.</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}