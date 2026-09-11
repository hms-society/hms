import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Switch } from '@/ui/shadcn/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useLegalCatalogAdminPage } from './use-legal-catalog-admin-page'

export const LegalCatalogAdminPage = () => {
  const {
    active,
    dialogState,
    error,
    feedback,
    filteredTopics,
    isDialogOpen,
    isLoading,
    isSaving,
    legalAreas,
    name,
    search,
    selectedArea,
    selectedAreaId,
    setActive,
    setName,
    setSearch,
    setSelectedAreaId,
    closeDialog,
    handleSaveDialog,
    handleToggleArea,
    handleToggleTopic,
    openEditAreaDialog,
    openEditTopicDialog,
    openNewAreaDialog,
    openNewTopicDialog,
  } = useLegalCatalogAdminPage()

  return (
    <main className='min-h-full bg-background px-6 py-8 lg:px-10'>
      <div className='mx-auto flex w-full max-w-[1400px] flex-col gap-7'>
        <header className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-2'>
            <p className='text-xs font-semibold uppercase tracking-normal text-muted-foreground'>
              Configurações
            </p>
            <h1 className='font-serif text-3xl font-semibold text-foreground'>
              Áreas do direito e tipos de demanda
            </h1>
            <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
              Configure as áreas de atuação do escritório e os tipos de demanda
              disponíveis na triagem e no cadastro de caso.
            </p>
          </div>

          <Button onClick={openNewAreaDialog}>
            <Icon name='plus' className='size-4' />
            Nova área
          </Button>
        </header>

        {feedback && (
          <p className='rounded-md border border-badge-success-border bg-badge-success px-4 py-3 text-sm text-badge-success-foreground'>
            {feedback}
          </p>
        )}

        {error && (
          <p className='rounded-md border border-badge-destructive-border bg-badge-destructive px-4 py-3 text-sm text-badge-destructive-foreground'>
            Não foi possível carregar ou salvar o catálogo jurídico.
          </p>
        )}

        {isLoading ? (
          <p className='rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
            Carregando áreas e tipos de demanda...
          </p>
        ) : (
          <section className='grid gap-6 lg:grid-cols-[340px_1fr]'>
            <aside className='rounded-lg border border-border bg-card'>
              <div className='flex items-center justify-between border-b border-border px-5 py-4'>
                <div>
                  <h2 className='font-serif text-lg font-semibold text-foreground'>
                    Áreas do direito
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    {legalAreas.length} áreas cadastradas
                  </p>
                </div>
              </div>

              <div className='flex flex-col gap-2 p-3'>
                {legalAreas.map((area) => (
                  <button
                    key={area.id}
                    type='button'
                    className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                      selectedAreaId === area.id
                        ? 'border-primary bg-highlight text-highlight-foreground'
                        : 'border-transparent text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-semibold'>
                        {area.name}
                      </span>
                      <span className='mt-1 block text-xs text-muted-foreground'>
                        {area.topics.length} tipos
                      </span>
                    </span>
                    <Badge variant={area.active ? 'default' : 'secondary'}>
                      {area.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </button>
                ))}
              </div>
            </aside>

            <section className='rounded-lg border border-border bg-card'>
              <div className='flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-normal text-muted-foreground'>
                    Tipos de demanda
                  </p>
                  <h2 className='font-serif text-2xl font-semibold text-foreground'>
                    {selectedArea?.name ?? 'Selecione uma área'}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Alterações não afetam casos já abertos.
                  </p>
                </div>

                <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                  {selectedArea && (
                    <Button
                      variant='outline'
                      onClick={() => openEditAreaDialog(selectedArea)}
                    >
                      <Icon name='pencil' className='size-4' />
                      Editar área
                    </Button>
                  )}
                  <Button disabled={!selectedArea} onClick={openNewTopicDialog}>
                    <Icon name='plus' className='size-4' />
                    Novo tipo
                  </Button>
                </div>
              </div>

              {selectedArea && (
                <div className='flex flex-col gap-4 p-5'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='relative w-full lg:max-w-sm'>
                      <Icon
                        name='search'
                        className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
                      />
                      <Input
                        value={search}
                        placeholder='Buscar tipo de demanda...'
                        className='pl-9'
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>

                    <div className='flex items-center gap-3 rounded-md border border-border px-3 py-2'>
                      <Label htmlFor='area-active' className='text-sm'>
                        Área ativa
                      </Label>
                      <Switch
                        id='area-active'
                        checked={selectedArea.active}
                        onCheckedChange={() => handleToggleArea(selectedArea)}
                      />
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTopics.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className='h-24 text-center text-muted-foreground'
                          >
                            Nenhum tipo de demanda encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTopics.map((topic) => (
                          <TableRow key={topic.id}>
                            <TableCell className='font-medium'>{topic.name}</TableCell>
                            <TableCell>
                              <Badge variant={topic.active ? 'default' : 'secondary'}>
                                {topic.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className='flex justify-end gap-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => openEditTopicDialog(topic)}
                                >
                                  <Icon name='pencil' className='size-4' />
                                  Editar
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleToggleTopic(topic)}
                                >
                                  {topic.active ? 'Inativar' : 'Reativar'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </section>
        )}

        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
              <DialogTitle>
                {dialogState?.kind === 'area'
                  ? dialogState.area
                    ? 'Editar área do direito'
                    : 'Nova área do direito'
                  : dialogState?.topic
                    ? 'Editar tipo de demanda'
                    : 'Novo tipo de demanda'}
              </DialogTitle>
              <DialogDescription>
                {dialogState?.kind === 'area'
                  ? 'Áreas organizam os tipos de demanda usados pela triagem e pelos casos.'
                  : `Tipo vinculado à área ${selectedArea?.name ?? ''}.`}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-2'>
              <div className='grid gap-2'>
                <Label htmlFor='catalog-name'>Nome</Label>
                <Input
                  id='catalog-name'
                  value={name}
                  placeholder={
                    dialogState?.kind === 'area'
                      ? 'Ex.: Previdenciário'
                      : 'Ex.: Aposentadoria por idade'
                  }
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className='flex items-center justify-between rounded-md border border-border px-3 py-3'>
                <div>
                  <Label htmlFor='catalog-active'>Disponível para novos usos</Label>
                  <p className='text-xs text-muted-foreground'>
                    Itens inativos seguem preservados em registros existentes.
                  </p>
                </div>
                <Switch
                  id='catalog-active'
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button disabled={!name.trim() || isSaving} onClick={handleSaveDialog}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
