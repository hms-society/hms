import { useNavigate } from '@tanstack/react-router'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/shadcn/sheet'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useClientCaseDrawer } from './use-client-case-drawer'

export type ClientCaseDrawerProps = {
  clientId?: string
  clientName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientCaseDrawer({
  clientId,
  clientName,
  open,
  onOpenChange,
}: ClientCaseDrawerProps) {
  const navigate = useNavigate()
  const {
    clientCases,
    activeCase,
    selectedCaseId,
    setSelectedCaseId,
    isLoading,
    completionPercentage,
    validatedItemsCount,
    pendingItemsCount,
    totalChecklistItems,
  } = useClientCaseDrawer({ clientId, clientName, open })

  const handleNavigateToCase = (caseId: string) => {
    onOpenChange(false)
    navigate({ to: '/advogado/meus-casos/$caseId', params: { caseId } })
  }

  const handleCreateCase = () => {
    onOpenChange(false)
    navigate({ to: '/advogado/meus-casos/novo-caso' })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id='client-case-drawer-container'
        side='right'
        className='w-full sm:max-w-md p-6 overflow-y-auto flex flex-col justify-between'
      >
        <div>
          <SheetHeader className='pb-4 border-b border-border/60 px-0'>
            <div className='flex items-center gap-2 text-s text-primary mb-1'>
              <Icon name='user' className='size-5' />
              <span>{clientName || 'Cliente selecionado'}</span>
            </div>
            <SheetTitle className='text-xl font-serif text-primary font-semibold'>
              Detalhamento de Casos
            </SheetTitle>
            <SheetDescription className='text-xs text-muted-foreground'>
              Visualização rápida dos dados processuais e status da documentação.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className='py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm'>
              <Icon name='refresh-cw' className='size-5 animate-spin' />
              <span>Carregando dados do caso...</span>
            </div>
          ) : clientCases.length === 0 ? (
            <div id='client-case-empty-state' className='py-8'>
              <Empty className='border border-dashed p-6 rounded-xl bg-muted/10'>
                <EmptyMedia variant='icon'>
                  <Icon name='briefcase' className='size-5 text-muted-foreground' />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Nenhum caso cadastrado</EmptyTitle>
                  <EmptyDescription>
                    Este cliente não possui processos ativos vinculados no momento.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className='mt-2'>
                  <Button
                    id='create-new-case-button'
                    onClick={handleCreateCase}
                    className='w-full gap-2 cursor-pointer'
                  >
                    <Icon name='plus' className='size-4' />
                    Criar Novo Caso
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className='flex flex-col gap-6 py-6'>
              {/* Múltiplos Casos Selector */}
              {clientCases.length > 1 && (
                <div id='client-case-selector' className='flex flex-col gap-1.5'>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Selecione o Caso ({clientCases.length}):
                  </span>
                  <div className='flex gap-2 overflow-x-auto pb-1'>
                    {clientCases.map((c) => (
                      <Button
                        key={c.id}
                        type='button'
                        variant={selectedCaseId === c.id ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setSelectedCaseId(c.id)}
                        className='text-xs shrink-0 cursor-pointer'
                      >
                        {c.publicCode || c.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações Principais do Caso */}
              {activeCase && (
                <div className='flex flex-col gap-5 bg-card border border-border/60 rounded-xl p-4 shadow-xs'>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 flex-wrap'>
                      <Badge variant='outline' className='text-[11px] font-mono'>
                        {activeCase.publicCode || 'Sem código'}
                      </Badge>
                      <Badge
                        variant='attention'
                        className='text-[11px] rounded-full px-2.5'
                      >
                        {activeCase.status === 'documentation'
                          ? 'Documentação em formação'
                          : activeCase.status}
                      </Badge>
                    </div>

                    <h3 className='font-semibold text-base text-foreground leading-snug'>
                      {activeCase.title}
                    </h3>

                    <div className='flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-1'>
                      <span className='flex items-center gap-1'>
                        <Icon name='scale' className='size-3.5' />
                        {activeCase.legalArea}
                      </span>
                      {activeCase.legalTopic && (
                        <span className='flex items-center gap-1'>
                          <Icon name='tag' className='size-3.5' />
                          {activeCase.legalTopic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progresso do Checklist */}
                  <div className='border-t border-border/60 pt-4 flex flex-col gap-2.5'>
                    <div className='flex justify-between items-center text-xs'>
                      <span className='font-medium text-foreground flex items-center gap-1.5'>
                        <Icon name='file-text' className='size-3.5 text-primary' />
                        Checklist & Dossiê
                      </span>
                      <span className='font-semibold text-primary'>
                        {completionPercentage}% Concluído
                      </span>
                    </div>

                    <div className='w-full bg-muted/60 h-2 rounded-full overflow-hidden'>
                      <div
                        className='bg-primary h-full transition-all duration-300'
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>

                    <div className='flex justify-between text-[11px] text-muted-foreground mt-0.5'>
                      <span>Validados: {validatedItemsCount}</span>
                      <span>Pendentes: {pendingItemsCount}</span>
                      <span>Total: {totalChecklistItems}</span>
                    </div>
                  </div>

                  {/* Equipe Responsável */}
                  {activeCase.team && activeCase.team.length > 0 && (
                    <div className='border-t border-border/60 pt-4 flex flex-col gap-2'>
                      <span className='text-xs font-medium text-muted-foreground'>
                        Equipe no Caso
                      </span>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {activeCase.team.map((member) => (
                          <div
                            key={member.collaboratorId}
                            className='flex items-center gap-2 bg-muted/30 border border-border/40 rounded-lg p-1.5 pr-3 text-xs'
                          >
                            <Avatar className='size-6 border border-background'>
                              <AvatarFallback className='bg-brand text-white text-[10px]'>
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium text-foreground text-[11px] truncate max-w-[120px]'>
                              {member.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões de Ação no Rodapé */}
        {clientCases.length > 0 && activeCase && (
          <div className='flex flex-col gap-2.5 pt-4 border-t border-border/60 mt-auto'>
            <Button
              id='go-to-full-case-button'
              onClick={() => handleNavigateToCase(activeCase.id)}
              className='w-full gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'
            >
              <Icon name='external-link' className='size-4' />
              Ver Página Completa do Caso
            </Button>
            <Button
              id='go-to-case-checklist-button'
              variant='outline'
              onClick={() => handleNavigateToCase(activeCase.id)}
              className='w-full gap-2 cursor-pointer'
            >
              <Icon name='file-text' className='size-4' />
              Ver Checklist & Dossiê
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
