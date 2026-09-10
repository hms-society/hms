export function ChecklistFooter() {
  return (
    <footer className='border-t border-border bg-muted/30 px-6 py-4 text-center'>
      <p className='text-[12px] text-muted-foreground'>
        Alterações nos templates não afetam casos já abertos — apenas
        novos casos instanciados após o salvamento.
      </p>
    </footer>
  )
}
