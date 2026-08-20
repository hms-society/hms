import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'

import { DocumentEditor } from '@/ui/document-production/widgets/components/document-editor'
import { RemoveDocumentSpecificationSection } from './remove-document-specification-section'
import { SwitchField } from './switch-field'
import { VariablePicker } from './variable-picker'
import {
  type DocumentSpecificationPageProps,
  useDocumentSpecificationPage,
} from './use-document-specification-page'

export type { DocumentSpecificationPageProps }

export const DocumentSpecificationPage = (props: DocumentSpecificationPageProps) => {
  const documentSpecificationPage = useDocumentSpecificationPage(props)
  const { form, application } = documentSpecificationPage

  if (documentSpecificationPage.isLoading)
    return (
      <main className='mx-auto w-full animate-pulse space-y-5'>
        <div className='h-8 w-72 rounded bg-muted' />
        <div className='h-96 rounded-xl bg-muted/50' />
      </main>
    )
  if (documentSpecificationPage.isNotFound)
    return (
      <main className='mx-auto w-full space-y-4'>
        <PageTitle className='text-2xl font-semibold'>Modelo não encontrado</PageTitle>
        <p className='text-muted-foreground'>Não foi possível localizar este modelo.</p>
        <Button type='button' onClick={documentSpecificationPage.handleRetry}>
          Tentar novamente
        </Button>
      </main>
    )
  if (documentSpecificationPage.detail.isError && props.mode === 'edit')
    return (
      <main className='mx-auto w-full space-y-4'>
        <PageTitle className='text-2xl font-semibold'>
          Não foi possível carregar o modelo
        </PageTitle>
        <p className='text-muted-foreground'>
          Ocorreu um erro temporário ao carregar este modelo. Tente novamente.
        </p>
        <Button type='button' onClick={documentSpecificationPage.handleRetry}>
          Tentar novamente
        </Button>
      </main>
    )

  return (
    <main className='mx-auto flex w-full flex-col gap-3'>
      <Button asChild variant='link' className='h-auto w-fit px-0 text-primary'>
        <Anchor route='documentSpecifications'>
          <Icon name='arrow-left' className='size-4' />
          Voltar para documentos
        </Anchor>
      </Button>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <PageTitle className='text-3xl'>
              {documentSpecificationPage.modelName || 'Novo modelo'}
            </PageTitle>
            {props.mode !== 'create' && (
              <span className='rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                {documentSpecificationPage.status === 'available'
                  ? 'Disponível'
                  : 'Indisponível'}
              </span>
            )}
          </div>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Escreva o conteúdo do template e insira variáveis nos pontos que serão
            preenchidos automaticamente.
          </p>
        </div>
        <Button
          type='button'
          disabled={
            !documentSpecificationPage.canSaveModel ||
            (props.mode !== 'create' &&
              !documentSpecificationPage.isTemplateDirty &&
              !documentSpecificationPage.isConfigurationDirty) ||
            documentSpecificationPage.actions.isCreating ||
            documentSpecificationPage.actions.isUpdatingConfiguration ||
            documentSpecificationPage.actions.isUpdatingTemplate
          }
          onClick={() => void documentSpecificationPage.handleTemplateSave()}
        >
          {documentSpecificationPage.actions.isCreating ||
          documentSpecificationPage.actions.isUpdatingConfiguration ||
          documentSpecificationPage.actions.isUpdatingTemplate
            ? 'Salvando…'
            : 'Salvar modelo'}
        </Button>
      </header>
      <Tabs
        value={documentSpecificationPage.activeTab}
        onValueChange={documentSpecificationPage.handleTabChange}
        className='w-full'
      >
        <TabsList
          variant='line'
          className='w-full justify-start border-b border-border/80'
        >
          <TabsTrigger
            value='configuration'
            className='flex-none gap-2 px-2.5 py-2 data-[state=active]:text-primary after:bg-primary'
          >
            <Icon name='settings' className='size-4' />
            Configuração
          </TabsTrigger>
          <TabsTrigger
            value='template'
            className='flex-none gap-2 px-2.5 py-2 data-[state=active]:text-primary after:bg-primary'
          >
            <Icon name='file-text' className='size-4' />
            Template
          </TabsTrigger>
        </TabsList>
        <TabsContent value='configuration' className='pt-3'>
          <div className='flex flex-col gap-4'>
            <section className='overflow-hidden rounded-xl border bg-card'>
              <header className='border-b px-4 py-3'>
                <h2 className='text-base font-semibold'>Informações gerais</h2>
                <p className='text-xs text-muted-foreground'>
                  Identifique o modelo e controle sua disponibilidade para novas gerações.
                </p>
              </header>
              <div className='grid gap-x-4 gap-y-3 p-4 md:grid-cols-[minmax(0,1fr)_18rem]'>
                <div className='space-y-1.5'>
                  <Label htmlFor='document-name'>Nome do documento *</Label>
                  <Input
                    id='document-name'
                    {...form.register('name')}
                    aria-invalid={Boolean(form.formState.errors.name)}
                  />
                  {form.formState.errors.name && (
                    <p className='text-xs text-destructive'>
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className='space-y-1.5'>
                  <Label>Disponibilidade</Label>
                  <SwitchField
                    checked={documentSpecificationPage.status === 'available'}
                    label='Disponibilidade do modelo'
                    offLabel='Indisponível'
                    onLabel='Disponível'
                    onToggle={documentSpecificationPage.toggleAvailability}
                  />
                </div>
                <div className='space-y-1.5 md:col-span-2'>
                  <Label htmlFor='document-description'>
                    Descrição interna (opcional)
                  </Label>
                  <Textarea
                    id='document-description'
                    {...form.register('description')}
                    aria-invalid={Boolean(form.formState.errors.description)}
                    className='min-h-10 resize-y'
                  />
                  {form.formState.errors.description && (
                    <p className='text-xs text-destructive'>
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className='overflow-hidden rounded-xl border bg-card'>
              <header className='border-b px-4 py-3'>
                <h2 className='text-base font-semibold'>Aplicação</h2>
                <p className='text-xs text-muted-foreground'>
                  Escolha o momento e aplique globalmente ou por áreas e temas.
                </p>
              </header>
              <div className='grid gap-4 p-4 md:grid-cols-[15rem_minmax(0,1fr)_15rem]'>
                <div className='space-y-1.5'>
                  <Label htmlFor='document-moment'>Momento</Label>
                  <Select
                    value={application.moment}
                    onValueChange={documentSpecificationPage.handleApplicationMoment}
                  >
                    <SelectTrigger id='document-moment' className='w-full' size='sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='consultation'>Consulta</SelectItem>
                      <SelectItem value='formalization'>Formalização</SelectItem>
                      <SelectItem value='legal_production'>Produção jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='document-scope'>Abrangência</Label>
                  <Select
                    value={application.scope}
                    onValueChange={documentSpecificationPage.handleApplicationScope}
                  >
                    <SelectTrigger id='document-scope' className='w-full' size='sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='global'>Global</SelectItem>
                      <SelectItem value='legal_context'>
                        Áreas e temas selecionados
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {application.scope === 'legal_context' && (
                <div className='space-y-4 border-t px-4 py-4'>
                  <div>
                    <h3 className='text-sm font-semibold'>Áreas e temas</h3>
                    <p className='text-xs text-muted-foreground'>
                      Associe os temas dentro de cada área jurídica.
                    </p>
                  </div>
                  {documentSpecificationPage.isCatalogError && (
                    <div
                      role='alert'
                      className='rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
                    >
                      Não foi possível carregar as áreas ou temas do Catálogo Jurídico.
                      Revise a conexão e tente novamente.
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='mt-2 block'
                        onClick={documentSpecificationPage.handleCatalogRetry}
                      >
                        Recarregar catálogo
                      </Button>
                    </div>
                  )}
                  <div className='space-y-2'>
                    <Label>Áreas jurídicas</Label>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {(documentSpecificationPage.catalog.areas.data ?? []).map(
                        (area) => (
                          <label
                            key={area.id}
                            htmlFor={`document-area-${area.id}`}
                            className='flex cursor-pointer items-center gap-2 text-sm'
                          >
                            <Checkbox
                              id={`document-area-${area.id}`}
                              checked={application.legalAreaIds.includes(area.id)}
                              onCheckedChange={() =>
                                documentSpecificationPage.handleAreaToggle(area.id)
                              }
                            />
                            {area.name}
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                  {application.legalAreaIds.map((areaId) => {
                    const area = (
                      documentSpecificationPage.catalog.areas.data ?? []
                    ).find((item) => item.id === areaId)
                    const areaTopics = (
                      documentSpecificationPage.topics.data ?? []
                    ).filter((topic) => topic.legalAreaId === areaId)
                    return (
                      <fieldset key={areaId} className='space-y-2 rounded-lg border p-3'>
                        <legend className='px-1 text-sm font-medium'>
                          Temas de {area?.name ?? 'área selecionada'}
                        </legend>
                        <div className='grid gap-2 sm:grid-cols-2'>
                          {areaTopics.map((topic) => (
                            <label
                              key={topic.id}
                              htmlFor={`document-topic-${topic.id}`}
                              className='flex cursor-pointer items-center gap-2 text-sm'
                            >
                              <Checkbox
                                id={`document-topic-${topic.id}`}
                                checked={Boolean(
                                  application.legalTopicIdsByArea[areaId]?.includes(
                                    topic.id,
                                  ),
                                )}
                                onCheckedChange={() =>
                                  documentSpecificationPage.handleTopicToggle(
                                    areaId,
                                    topic.id,
                                  )
                                }
                              />
                              {topic.name}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )
                  })}
                </div>
              )}
            </section>
            {props.mode === 'edit' && (
              <RemoveDocumentSpecificationSection
                modelName={documentSpecificationPage.modelName}
                open={documentSpecificationPage.isDeleteDialogOpen}
                isRemoving={documentSpecificationPage.actions.isDeleting}
                onOpenChange={documentSpecificationPage.handleDeleteDialogOpenChange}
                onRequestRemove={documentSpecificationPage.handleDeleteRequest}
                onConfirmRemove={documentSpecificationPage.handleDeleteConfirm}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value='template' className='pt-3'>
          <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start'>
            <section className='min-w-0 overflow-hidden rounded-xl border bg-card'>
              <div className='flex items-end justify-between gap-3 border-b px-4 py-3'>
                <div>
                  <h2 className='text-base font-semibold'>Conteúdo do template</h2>
                  <p className='text-xs text-muted-foreground'>
                    Formate o documento e insira campos dinâmicos onde necessário.
                  </p>
                </div>
              </div>
              <DocumentEditor
                content={documentSpecificationPage.content}
                onChange={documentSpecificationPage.handleContentChange}
                onEditorReady={documentSpecificationPage.handleEditorReady}
              />
              <div className='flex items-center justify-between gap-3 border-t px-4 py-2'>
                <p className='text-xs text-muted-foreground'>
                  {documentSpecificationPage.isTemplateEmpty &&
                  !documentSpecificationPage.isConfigurationDirty
                    ? 'Começar a escrever para habilitar o salvamento.'
                    : documentSpecificationPage.isTemplateDirty ||
                        documentSpecificationPage.isConfigurationDirty
                      ? 'Alterações não salvas.'
                      : 'Todas as alterações estão salvas.'}
                </p>
                <p className='shrink-0 text-xs text-muted-foreground'>
                  {documentSpecificationPage.wordCount}{' '}
                  {documentSpecificationPage.wordCount === 1 ? 'palavra' : 'palavras'}
                </p>
              </div>
            </section>
            <div className='xl:sticky xl:top-28'>
              <VariablePicker
                variables={documentSpecificationPage.variables}
                onInsert={(name) => documentSpecificationPage.insertVariable?.(name)}
                onAdd={documentSpecificationPage.handleAddVariable}
                onRemove={documentSpecificationPage.handleRemoveVariable}
                onUpdate={documentSpecificationPage.handleUpdateVariable}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
