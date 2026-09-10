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
        <ChecklistHeader onSave={saveTemplate} />

        <LegalAreaTabs
          areas={areas}
          activeAreaId={activeAreaId}
          onChange={setActiveAreaId}
        />

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
