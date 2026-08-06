import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { Textarea } from '@/ui/shadcn/textarea'

import { DocumentEditor } from './document-editor'
import { VariablePicker } from './variable-picker'
import {
  type DocumentSpecificationPageProps,
  useDocumentSpecificationPage,
} from './use-document-specification-page'

export type { DocumentSpecificationPageProps }

export const DocumentSpecificationPage = (props: DocumentSpecificationPageProps) => {
  const controller = useDocumentSpecificationPage(props)
  const { form, application } = controller
  if (controller.isLoading)
    return (
      <main className='mx-auto w-full animate-pulse space-y-5'>
        <div className='h-8 w-72 rounded bg-muted' />
        <div className='h-96 rounded-xl bg-muted/50' />
      </main>
    )
  if (controller.isNotFound)
    return (
      <main className='mx-auto w-full space-y-4'>
        <h1 className='font-serif text-2xl font-semibold'>Modelo não encontrado</h1>
        <p className='text-muted-foreground'>Não foi possível localizar este modelo.</p>
        <Button type='button' onClick={controller.handleRetry}>
          Tentar novamente
        </Button>
      </main>
    )
  if (controller.detail.isError && props.mode === 'edit')
    return (
      <main className='mx-auto w-full space-y-4'>
        <h1 className='font-serif text-2xl font-semibold'>
          Não foi possível carregar o modelo
        </h1>
        <p className='text-muted-foreground'>
          Ocorreu um erro temporário ao carregar este modelo. Tente novamente.
        </p>
        <Button type='button' onClick={controller.handleRetry}>
          Tentar novamente
        </Button>
      </main>
    )
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-col gap-5'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='text-xs font-medium uppercase tracking-widest text-muted-foreground'>
            Produção documental
          </p>
          <h1 className='font-serif text-3xl font-semibold'>
            {props.mode === 'create'
              ? 'Novo modelo'
              : form.watch('name') || 'Modelo de documento'}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {props.mode === 'create'
              ? 'Configure a identidade antes de escrever o template.'
              : 'Gerencie a configuração e o conteúdo rico deste modelo.'}
          </p>
        </div>
        <span className='rounded-full border px-3 py-1 text-xs font-medium'>
          {form.watch('status') === 'available' ? 'Disponível' : 'Indisponível'}
        </span>
      </header>
      {controller.errorMessage && (
        <div
          role='alert'
          className='rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
        >
          {controller.errorMessage}
        </div>
      )}
      {controller.successMessage && (
        <div
          role='status'
          className='rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700'
        >
          {controller.successMessage}
        </div>
      )}
      <Tabs
        value={controller.activeTab}
        onValueChange={controller.handleTabChange}
        className='w-full'
      >
        <TabsList variant='line'>
          <TabsTrigger value='configuration'>Configuração</TabsTrigger>
          <TabsTrigger value='template' disabled={props.mode === 'create'}>
            Template
          </TabsTrigger>
        </TabsList>
        <TabsContent value='configuration' className='pt-5'>
          <form
            className='flex flex-col gap-5'
            onSubmit={form.handleSubmit(controller.handleConfigurationSubmit)}
          >
            <section className='space-y-5 rounded-xl border bg-card p-5 shadow-sm'>
              <div>
                <h2 className='font-serif text-xl font-semibold'>Informações gerais</h2>
                <p className='text-sm text-muted-foreground'>
                  Nome e descrição são obrigatórios para manter o catálogo claro.
                </p>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='document-name'>Nome</Label>
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
                <div className='space-y-2'>
                  <Label htmlFor='document-description'>Descrição</Label>
                  <Textarea
                    id='document-description'
                    {...form.register('description')}
                    aria-invalid={Boolean(form.formState.errors.description)}
                  />
                  {form.formState.errors.description && (
                    <p className='text-xs text-destructive'>
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              {props.mode === 'edit' && (
                <div className='space-y-2'>
                  <Label htmlFor='document-status'>Disponibilidade</Label>
                  <select
                    id='document-status'
                    className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-xs'
                    {...form.register('status')}
                    aria-invalid={Boolean(form.formState.errors.status)}
                  >
                    <option value='unavailable'>Indisponível</option>
                    <option value='available'>Disponível</option>
                  </select>
                  {form.formState.errors.status && (
                    <p className='text-xs text-destructive'>
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>
              )}
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='document-moment'>Momento</Label>
                  <select
                    id='document-moment'
                    className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
                    value={application.moment}
                    onChange={(event) =>
                      form.setValue(
                        'application.moment',
                        event.target.value as typeof application.moment,
                        { shouldDirty: true },
                      )
                    }
                  >
                    <option value='consultation'>Consulta</option>
                    <option value='formalization'>Formalização</option>
                    <option value='legal_production'>Produção jurídica</option>
                  </select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='document-scope'>Aplicação</Label>
                  <select
                    id='document-scope'
                    className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
                    value={application.scope}
                    onChange={(event) =>
                      controller.handleApplicationScope(
                        event.target.value as 'global' | 'legal_context',
                      )
                    }
                  >
                    <option value='global'>Global</option>
                    <option value='legal_context'>Contexto jurídico</option>
                  </select>
                </div>
                <label className='flex items-center gap-2 pt-7 text-sm'>
                  <input type='checkbox' {...form.register('isRequired')} /> Documento
                  obrigatório
                </label>
              </div>
              {application.scope === 'legal_context' && (
                <div className='space-y-4'>
                  {controller.isCatalogError && (
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
                        onClick={controller.handleCatalogRetry}
                      >
                        Recarregar catálogo
                      </Button>
                    </div>
                  )}
                  <div className='space-y-2'>
                    <Label>Áreas jurídicas</Label>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {(controller.catalog.areas.data ?? []).map((area) => (
                        <label key={area.id} className='flex items-center gap-2 text-sm'>
                          <input
                            type='checkbox'
                            checked={application.legalAreaIds.includes(area.id)}
                            onChange={() => controller.handleAreaToggle(area.id)}
                          />
                          {area.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  {application.legalAreaIds.map((areaId) => {
                    const area = (controller.catalog.areas.data ?? []).find(
                      (item) => item.id === areaId,
                    )
                    const areaTopics = (controller.topics.data ?? []).filter(
                      (topic) => topic.legalAreaId === areaId,
                    )
                    return (
                      <fieldset key={areaId} className='space-y-2 rounded-lg border p-3'>
                        <legend className='px-1 text-sm font-medium'>
                          Temas de {area?.name ?? 'área selecionada'}
                        </legend>
                        <div className='grid gap-2 sm:grid-cols-2'>
                          {areaTopics.map((topic) => (
                            <label
                              key={topic.id}
                              className='flex items-center gap-2 text-sm'
                            >
                              <input
                                type='checkbox'
                                checked={Boolean(
                                  application.legalTopicIdsByArea[areaId]?.includes(
                                    topic.id,
                                  ),
                                )}
                                onChange={() =>
                                  controller.handleTopicToggle(areaId, topic.id)
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
              <div className='flex justify-end border-t pt-4'>
                <Button
                  type='submit'
                  disabled={
                    controller.actions.isUpdatingConfiguration ||
                    controller.actions.isCreating
                  }
                >
                  {controller.actions.isCreating
                    ? 'Criando…'
                    : controller.actions.isUpdatingConfiguration
                      ? 'Salvando…'
                      : props.mode === 'create'
                        ? 'Criar modelo'
                        : 'Salvar modelo'}
                </Button>
              </div>
            </section>
            <aside className='rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Estado do modelo
              </h2>
              <p className='mt-2'>
                Novos modelos começam indisponíveis. Depois de escrever um template
                válido, você poderá disponibilizá-los.
              </p>
              <p className='mt-4 font-medium text-foreground'>
                Alterações não salvas: {controller.isDirty ? 'sim' : 'não'}
              </p>
            </aside>
          </form>
        </TabsContent>
        <TabsContent value='template' className='pt-5'>
          <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start'>
            <section className='space-y-4'>
              <div>
                <h2 className='font-serif text-xl font-semibold'>Template rico</h2>
                <p className='text-sm text-muted-foreground'>
                  Escreva, formate e insira variáveis no ponto de edição atual.
                </p>
              </div>
              <DocumentEditor
                content={controller.content}
                onChange={controller.handleContentChange}
                onEditorReady={controller.handleEditorReady}
              />
              <p className='text-xs text-muted-foreground'>
                {controller.wordCount}{' '}
                {controller.wordCount === 1 ? 'palavra' : 'palavras'}
              </p>
              <div className='flex items-center justify-between border-t pt-4'>
                <p className='text-xs text-muted-foreground'>
                  {controller.isTemplateEmpty
                    ? 'Começar a escrever para habilitar o salvamento.'
                    : 'O template será validado antes do envio.'}
                </p>
                <Button
                  type='button'
                  disabled={
                    !controller.isTemplateDirty ||
                    controller.isTemplateEmpty ||
                    controller.actions.isUpdatingTemplate
                  }
                  onClick={() => void controller.handleTemplateSave()}
                >
                  {controller.actions.isUpdatingTemplate
                    ? 'Salvando…'
                    : 'Salvar template'}
                </Button>
              </div>
            </section>
            <div className='xl:sticky xl:top-28'>
              <VariablePicker
                variables={controller.variables}
                onInsert={(name) => controller.insertVariable?.(name)}
                onAdd={controller.handleAddVariable}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
