import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'

export function ClientDocumentsTab() {
  return (
    <div className="flex flex-col gap-6 pt-2">
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
        <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-mono tracking-wide">LOTE-20260620-0031</span>
              <span className="flex items-center gap-1.5"><Icon name="message-square" className="w-3.5 h-3.5" /> WhatsApp</span>
            </div>
            <span>20/06/2026</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                  <Icon name="file-text" className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">RG_frente_verso.jpg</span>
                  <span className="text-xs text-muted-foreground">Documento de identificação</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">Validado</Badge>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground"><Icon name="eye" className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                  <Icon name="file-text" className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">comprovante_residencia.pdf</span>
                  <span className="text-xs text-muted-foreground">Comprovante de residência</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">Validado</Badge>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground"><Icon name="eye" className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                  <Icon name="file-text" className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">extrato_inss.pdf</span>
                  <span className="text-xs text-muted-foreground">Extrato previdenciário — a confirmar</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-none font-medium">Revisão humana pendente</Badge>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground"><Icon name="eye" className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="font-mono tracking-wide">LOTE-20260115-0009</span>
              <span className="flex items-center gap-1.5"><Icon name="arrow-up" className="w-3.5 h-3.5" /> Upload interno · Atend. Júlia</span>
            </div>
            <span>15/01/2026</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                  <Icon name="file-text" className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">contrato_assinado.pdf</span>
                  <span className="text-xs text-muted-foreground">Contrato de honorários</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">Validado</Badge>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground"><Icon name="eye" className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                  <Icon name="file-text" className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">procuracao.pdf</span>
                  <span className="text-xs text-muted-foreground">Procuração ad judicia</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-medium">Validado</Badge>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground"><Icon name="eye" className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}