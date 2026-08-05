import type { IntakeListItem } from '@hms/core/intake/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  formatIntakeDate,
  INTAKE_CONTACT_CHANNEL_LABELS,
  INTAKE_STATUS_LABELS,
} from '../intakes-page-constants'

export type IntakesTableProps = {
  copiedIntakeId?: string
  items: readonly IntakeListItem[]
  onCopyId: (displayId: string) => void | Promise<void>
}

export const IntakesTable = ({ copiedIntakeId, items, onCopyId }: IntakesTableProps) => (
  <div className='overflow-x-auto'>
    <Table className='min-w-[70rem] text-xs'>
      <TableHeader>
        <TableRow>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            ID do Intake
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Registrado em
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Cliente
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Canal de contato
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Demanda
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Status
          </TableHead>
          <TableHead className='h-9 px-3 py-2 text-[10px] tracking-wide text-muted-foreground'>
            Responsável
          </TableHead>
          <TableHead className='h-9 w-16 px-3 py-2 text-right text-[10px] tracking-wide text-muted-foreground'>
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((intake) => (
          <TableRow
            key={intake.intakeId}
            tabIndex={0}
            onClick={(event) => {
              if (
                event.target !== event.currentTarget &&
                (event.target as HTMLElement).closest(
                  'a,button,input,select,textarea,[role="button"]',
                )
              ) {
                return
              }

              event.currentTarget
                .querySelector<HTMLAnchorElement>('[data-intake-details-link]')
                ?.click()
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return

              event.preventDefault()
              event.currentTarget
                .querySelector<HTMLAnchorElement>('[data-intake-details-link]')
                ?.click()
            }}
          >
            <TableCell className='whitespace-nowrap px-3 py-3 align-middle'>
              <div className='flex items-center gap-1.5'>
                <Anchor
                  route='intakeDetails'
                  params={{ intakeId: intake.intakeId }}
                  data-intake-details-link
                  className='sr-only'
                >
                  Ver detalhes de {intake.displayId}
                </Anchor>
                <Anchor
                  route='intakeDetails'
                  params={{ intakeId: intake.intakeId }}
                  className='font-mono text-xs font-bold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                  {intake.displayId}
                </Anchor>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-xs'
                  aria-label={
                    copiedIntakeId === intake.displayId
                      ? `ID ${intake.displayId} copiado`
                      : `Copiar ID ${intake.displayId}`
                  }
                  onClick={() => void onCopyId(intake.displayId)}
                >
                  <Icon
                    name={
                      copiedIntakeId === intake.displayId ? 'check' : 'clipboard-list'
                    }
                  />
                </Button>
              </div>
              {copiedIntakeId === intake.displayId && (
                <span className='sr-only' role='status'>
                  ID {intake.displayId} copiado para a área de transferência.
                </span>
              )}
            </TableCell>
            <TableCell className='whitespace-nowrap px-3 py-3 align-middle text-[11px] text-muted-foreground'>
              {formatIntakeDate(intake.createdAt)}
            </TableCell>
            <TableCell className='px-3 py-3 align-middle'>
              <div className='max-w-36 truncate text-[11px] font-semibold text-foreground'>
                {intake.client.name}
              </div>
              <div className='font-mono text-[10px] text-muted-foreground'>
                {intake.client.maskedTaxId}
              </div>
            </TableCell>
            <TableCell className='whitespace-nowrap px-3 py-3 align-middle'>
              <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold text-highlight-foreground'>
                <Icon
                  name={
                    intake.contactChannel === 'whatsapp'
                      ? 'message-square'
                      : intake.contactChannel === 'email'
                        ? 'mail'
                        : intake.contactChannel === 'phone'
                          ? 'phone'
                          : 'map-pin'
                  }
                  className='size-3.5'
                />
                {INTAKE_CONTACT_CHANNEL_LABELS[intake.contactChannel] ??
                  intake.contactChannel}
              </span>
            </TableCell>
            <TableCell className='max-w-52 px-3 py-3 align-middle'>
              {intake.demandNotes ? (
                <span
                  className='block truncate text-[11px] font-semibold text-foreground'
                  title={intake.demandNotes}
                >
                  {intake.demandNotes}
                  <span className='sr-only'> Demanda completa disponível no foco.</span>
                </span>
              ) : (
                <span className='text-[11px] text-muted-foreground'>Sem descrição</span>
              )}
            </TableCell>
            <TableCell className='px-3 py-3 align-middle'>
              <Badge variant='secondary' className='text-[10px]'>
                {INTAKE_STATUS_LABELS[intake.status] ?? intake.status}
              </Badge>
            </TableCell>
            <TableCell className='whitespace-nowrap px-3 py-3 align-middle'>
              <div className='flex items-center gap-2'>
                <span className='flex size-6 items-center justify-center rounded-full bg-brand-highlight text-[10px] font-bold text-brand-highlight-foreground'>
                  {intake.responsible.professionalName.slice(0, 1).toUpperCase()}
                </span>
                <span className='max-w-28 truncate text-[11px] font-semibold text-foreground'>
                  {intake.responsible.professionalName}
                </span>
              </div>
            </TableCell>
            <TableCell className='px-3 py-3 text-right align-middle'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-xs'
                    aria-label={`Ações de ${intake.displayId}`}
                  >
                    <Icon name='ellipsis' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuItem asChild>
                    <Anchor
                      route='intakeDetails'
                      params={{ intakeId: intake.intakeId }}
                      className='gap-2'
                    >
                      <Icon name='eye' className='size-4 text-muted-foreground' />
                      Ver detalhes
                    </Anchor>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Icon name='pencil' className='size-4 text-muted-foreground' />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled
                    className='text-destructive focus:text-destructive'
                  >
                    <Icon name='x' className='size-4' />
                    Encerrar sem contratação
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
