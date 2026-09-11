import { ChecklistHeader } from './components/checklist-header'
import { LegalAreaTabs } from './components/legal-area-tabs'
import { ChecklistCard } from './components/checklist-card'
import { useChecklistsTemplates } from './use-checklist-template'

export default function ChecklistsTemplatesPage() {
  const {
    areas,
    activeArea,
    activeAreaId,
    documents,
    error,
    isLoading,
    isSaving,
    saveMessage,
    search,
    setSearch,
    setActiveAreaId,
    toggleRequired,
    changeDocumentType,
    removeDocument,
    addDocument,
    saveTemplate,
  } = useChecklistsTemplates()

  return (
    <main className='min-h-full bg-background px-6 py-8 lg:px-10'>
      <div className='mx-auto flex w-full max-w-[1400px] flex-col gap-7'>
        <ChecklistHeader onSave={saveTemplate} isSaving={isSaving} />

        {saveMessage && (
          <p className='rounded-md border border-badge-success-border bg-badge-success px-4 py-3 text-sm text-badge-success-foreground'>
            {saveMessage}
          </p>
        )}

        {error && (
          <p className='rounded-md border border-badge-destructive-border bg-badge-destructive px-4 py-3 text-sm text-badge-destructive-foreground'>
            Não foi possível carregar ou salvar os templates de checklist.
          </p>
        )}

        {isLoading ? (
          <p className='rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
            Carregando templates de checklist...
          </p>
        ) : (
          <LegalAreaTabs
            areas={areas}
            activeAreaId={activeAreaId}
            onChange={setActiveAreaId}
          />
        )}

        {activeArea && (
          <ChecklistCard
            areaName={activeArea.name}
            documents={documents}
            search={search}
            onSearchChange={setSearch}
            onToggleRequired={toggleRequired}
            onChangeType={changeDocumentType}
            onDelete={removeDocument}
            onAddDocument={addDocument}
          />
        )}
      </div>
    </main>
  )
}
