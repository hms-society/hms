import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'

export type PendingMarkerNotFoundDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const PendingMarkerNotFoundDialog = ({
  open,
  onOpenChange,
}: PendingMarkerNotFoundDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Marcador não encontrado</DialogTitle>
        <DialogDescription>
          Esse trecho pode ter sido editado. A pendência permanece registrada e não será
          removida nesta entrega.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type='button' onClick={() => onOpenChange(false)}>
          Manter pendência
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
