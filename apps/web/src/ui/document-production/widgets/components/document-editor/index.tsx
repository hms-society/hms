import { EditorContent } from '@tiptap/react'

import { Button } from '@/ui/shadcn/button'
import { TooltipProvider } from '@/ui/shadcn/tooltip'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ToolbarButton } from './toolbar-button'
import { type DocumentEditorProps, useDocumentEditor } from './use-document-editor'

export {
  DOCUMENT_TEMPLATE_LINK_OPTIONS,
  isAllowedDocumentTemplateHref,
  parseDocumentTemplateContent,
} from './use-document-editor'
export type { DocumentEditorProps } from './use-document-editor'

export const DocumentEditor = ({
  content,
  onChange,
  onEditorReady,
  onFocus,
  ariaLabel = 'Conteúdo do template',
  editable = true,
  emptyState,
  highlightedTerms = [],
}: DocumentEditorProps) => {
  const documentEditor = useDocumentEditor({
    content,
    onChange,
    onEditorReady,
    onFocus,
    ariaLabel,
    editable,
    highlightedTerms,
  })
  const { editor } = documentEditor
  if (!editor)
    return (
      <div aria-busy='true' className='min-h-[34rem] rounded-xl border bg-muted/20' />
    )

  const renderedEmptyState =
    emptyState === undefined ? (
      <>
        <span className='flex size-10 items-center justify-center rounded-lg bg-highlight text-highlight-foreground'>
          <Icon name='file-text' className='size-5' />
        </span>
        <div>
          <p className='font-medium text-foreground'>Ainda não há conteúdo no template</p>
          <p className='mx-auto mt-1 max-w-sm text-sm text-muted-foreground'>
            Comece a escrever o documento ou insira uma variável para montar o conteúdo
            automaticamente.
          </p>
        </div>
        {editable && (
          <Button
            type='button'
            size='sm'
            className='pointer-events-auto'
            onClick={documentEditor.focusEditor}
          >
            Começar a escrever
          </Button>
        )}
        <p className='text-xs text-muted-foreground'>
          Você também pode inserir variáveis pelo painel ao lado.
        </p>
      </>
    ) : (
      emptyState
    )

  return (
    <div className='relative overflow-hidden bg-card'>
      {editable && (
        <div
          className='flex min-h-12 flex-wrap items-center gap-0.5 border-b bg-secondary/35 px-3 py-1.5'
          role='toolbar'
          aria-label='Formatação do template'
        >
          <TooltipProvider>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Parágrafo'
              aria-label='Parágrafo'
              onClick={documentEditor.setParagraph}
            >
              <Icon name='pilcrow' className='size-4 text-primary' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Título 1'
              aria-label='Título 1'
              aria-pressed={documentEditor.active.heading1}
              onClick={() => documentEditor.toggleHeading(1)}
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Título 2'
              aria-label='Título 2'
              aria-pressed={documentEditor.active.heading2}
              onClick={() => documentEditor.toggleHeading(2)}
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Negrito'
              aria-label='Negrito'
              aria-pressed={documentEditor.active.bold}
              onClick={documentEditor.toggleBold}
            >
              <strong className='text-sm'>B</strong>
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Itálico'
              aria-label='Itálico'
              aria-pressed={documentEditor.active.italic}
              onClick={documentEditor.toggleItalic}
            >
              <em className='text-sm'>I</em>
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Sublinhado'
              aria-label='Sublinhado'
              aria-pressed={documentEditor.active.underline}
              onClick={documentEditor.toggleUnderline}
            >
              <u className='text-sm'>U</u>
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Lista com marcadores'
              aria-label='Lista'
              aria-pressed={documentEditor.active.bulletList}
              onClick={documentEditor.toggleBulletList}
            >
              <Icon name='list-search' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Citação'
              aria-label='Citação'
              aria-pressed={documentEditor.active.blockquote}
              onClick={documentEditor.toggleBlockquote}
            >
              <Icon name='quote' className='size-4' />
            </ToolbarButton>
            <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Lista numerada'
              aria-label='Lista numerada'
              aria-pressed={documentEditor.active.orderedList}
              onClick={documentEditor.toggleOrderedList}
            >
              <Icon name='list-ordered' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Texto riscado'
              aria-label='Riscado'
              aria-pressed={documentEditor.active.strike}
              onClick={documentEditor.toggleStrike}
            >
              <Icon name='strikethrough' className='size-4' />
            </ToolbarButton>
            <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Alinhar à esquerda'
              aria-label='Alinhar à esquerda'
              aria-pressed={documentEditor.active.alignLeft}
              onClick={() => documentEditor.setTextAlign('left')}
            >
              <Icon name='align-left' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Alinhar ao centro'
              aria-label='Alinhar ao centro'
              aria-pressed={documentEditor.active.alignCenter}
              onClick={() => documentEditor.setTextAlign('center')}
            >
              <Icon name='align-center' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground aria-[pressed=true]:bg-highlight/70 aria-[pressed=true]:text-primary'
              tooltip='Alinhar à direita'
              aria-label='Alinhar à direita'
              aria-pressed={documentEditor.active.alignRight}
              onClick={() => documentEditor.setTextAlign('right')}
            >
              <Icon name='align-right' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Limpar formatação'
              aria-label='Limpar formatação'
              onClick={documentEditor.clearFormatting}
            >
              <Icon name='remove-formatting' className='size-4' />
            </ToolbarButton>
            <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Desfazer'
              aria-label='Desfazer'
              disabled={!documentEditor.canUndo}
              onClick={documentEditor.undo}
            >
              <Icon name='undo' className='size-4' />
            </ToolbarButton>
            <ToolbarButton
              type='button'
              size='icon-xs'
              variant='ghost'
              className='text-muted-foreground'
              tooltip='Refazer'
              aria-label='Refazer'
              disabled={!documentEditor.canRedo}
              onClick={documentEditor.redo}
            >
              <Icon name='redo' className='size-4' />
            </ToolbarButton>
          </TooltipProvider>
        </div>
      )}
      <div className='bg-secondary/35 p-4 sm:p-6'>
        <div className='relative mx-auto min-h-[28rem] w-full max-w-5xl rounded-md border bg-card shadow-sm'>
          <EditorContent
            editor={editor}
            aria-label={ariaLabel}
            className='min-h-[28rem] [&_.ProseMirror]:min-h-[28rem] [&_.ProseMirror]:border-0 [&_.ProseMirror]:bg-transparent [&_.ProseMirror]:p-8 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:pl-1 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:rounded-md [&_.ProseMirror_blockquote]:border [&_.ProseMirror_blockquote]:border-primary/20 [&_.ProseMirror_blockquote]:bg-muted/50 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-2 [&_.ProseMirror_h1]:font-serif [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-xl'
          />
          {documentEditor.isEmpty && renderedEmptyState && (
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center'>
              {renderedEmptyState}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
