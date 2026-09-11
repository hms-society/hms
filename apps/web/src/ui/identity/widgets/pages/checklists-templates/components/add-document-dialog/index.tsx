import { useState } from 'react'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import type { DocumentFileType } from '../../types'

type AddDocumentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, types: readonly DocumentFileType[], required: boolean) => void
}

export function AddDocumentDialog({ open, onOpenChange, onAdd }: AddDocumentDialogProps) {
  const [name, setName] = useState('')
  const [types, setTypes] = useState<readonly DocumentFileType[]>([])
  const [required, setRequired] = useState(true)
  const [typesOpen, setTypesOpen] = useState(false)

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName('')
      setTypes([])
      setRequired(true)
      setTypesOpen(false)
    }

    onOpenChange(value)
  }

  const handleSubmit = () => {
    const trimmedName = name.trim()

    if (!trimmedName || types.length === 0) return

    onAdd(trimmedName, types, required)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='
          w-[calc(100%-32px)]
          max-w-[420px]
          h-[478px]
          gap-0
          overflow-hidden
          rounded-[16px]
          border-0
          bg-white
          p-0
          shadow-[0_12px_35px_rgba(0,0,0,0.18)]
        '
      >
        <DialogHeader
          className='
            flex
            h-[72px]
            shrink-0
            flex-row
            items-center
            border-b
            border-[#E5E9ED]
            px-5
          '
        >
          <DialogTitle
            className='
              font-serif
              text-[20px]
              font-semibold
              leading-[26px]
              tracking-[-0.2px]
              text-[#164F55]
            '
          >
            Adicionar Documento ao Checklist
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 px-5 pt-5'>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='document-name'
                className='
                  text-[14px]
                  font-semibold
                  leading-[18px]
                  text-[#171B2A]
                '
              >
                Nome do Documento <span className='text-[#B42318]'>*</span>
              </Label>

              <Input
                id='document-name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='Ex: Procuração Assinada'
                autoFocus
                className='
                  h-[44px]
                  rounded-[9px]
                  border-[#D8E0E6]
                  px-[14px]
                  text-[14px]
                  text-[#252B35]
                  shadow-none
                  placeholder:text-[#6B7078]
                  focus-visible:border-[#377F85]
                  focus-visible:ring-1
                  focus-visible:ring-[#377F85]
                '
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='document-type'
                className='
                  text-[14px]
                  font-semibold
                  leading-[18px]
                  text-[#171B2A]
                '
              >
                Tipo de Arquivo Aceito <span className='text-[#B42318]'>*</span>
              </Label>

              <Popover open={typesOpen} onOpenChange={setTypesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id='document-type'
                    type='button'
                    variant='outline'
                    className='
                      h-[44px]
                      w-full
                      justify-start
                      rounded-[9px]
                      border-[#D8E0E6]
                      px-[14px]
                      text-[14px]
                      font-normal
                      text-[#252B35]
                      shadow-none
                      hover:bg-white
                    '
                  >
                    {types.length > 0
                      ? formatDocumentTypes(types)
                      : 'Selecione os tipos...'}
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align='start'
                  className='
                    w-[var(--radix-popover-trigger-width)]
                    p-1
                  '
                >
                  <div className='flex flex-col'>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => {
                          setTypes((currentTypes) =>
                            toggleDocumentType(currentTypes, option.value),
                          )
                        }}
                        className='
                          flex
                          w-full
                          items-center
                          gap-2
                          rounded-md
                          px-2
                          py-2
                          text-left
                          text-sm
                          outline-none
                          hover:bg-accent
                          hover:text-accent-foreground
                        '
                      >
                        <Checkbox
                          checked={types.includes(option.value)}
                          onCheckedChange={() => {
                            setTypes((currentTypes) =>
                              toggleDocumentType(currentTypes, option.value),
                            )
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />

                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className='flex items-start justify-between'>
              <div className='pr-4'>
                <p
                  className='
                    text-[14px]
                    font-semibold
                    leading-[18px]
                    text-[#171B2A]
                  '
                >
                  Obrigatório de Mérito
                </p>

                <p
                  className='
                    mt-1
                    max-w-[300px]
                    text-[12px]
                    leading-[17px]
                    text-[#5F6368]
                  '
                >
                  Quando ativo, este documento bloqueia o avanço do checklist se não for
                  recebido.
                </p>
              </div>

              <button
                type='button'
                role='switch'
                aria-checked={required}
                aria-label='Obrigatório de Mérito'
                onClick={() => setRequired((value) => !value)}
                className={`
                  relative
                  mt-[1px]
                  inline-flex
                  h-[22px]
                  w-[40px]
                  shrink-0
                  cursor-pointer
                  appearance-none
                  items-center
                  rounded-full
                  border-0
                  p-0
                  outline-none
                  transition-colors
                  duration-200
                  focus-visible:ring-2
                  focus-visible:ring-[#377F85]
                  focus-visible:ring-offset-2
                  ${required ? 'bg-[#175A60]' : 'bg-[#CBD2D7]'}
                `}
              >
                <span
                  className={`
                    pointer-events-none
                    absolute
                    left-[3px]
                    top-[3px]
                    h-[16px]
                    w-[16px]
                    rounded-full
                    bg-white
                    shadow-[0_1px_3px_rgba(0,0,0,0.2)]
                    transition-transform
                    duration-200
                    ${required ? 'translate-x-[18px]' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter
          className='
            flex
            h-[72px]
            shrink-0
            flex-row
            items-end
            justify-end
            gap-[10px]
            border-0
            bg-white
            px-5
            pb-5
            pt-0
          '
        >
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            className='
              h-[40px]
              rounded-full
              border-[#367F85]
              bg-white
              px-[18px]
              text-[14px]
              font-medium
              text-[#367F85]
              shadow-none
              hover:bg-[#F3F8F8]
              hover:text-[#367F85]
              focus:bg-white
              focus:text-[#367F85]
              active:bg-white
            '
          >
            Cancelar
          </Button>

          <Button
            type='button'
            variant='brand'
            disabled={!name.trim() || types.length === 0}
            onClick={handleSubmit}
            className='
              h-[40px]
              rounded-full
              border-0
              bg-[#43848A]
              px-[20px]
              text-[14px]
              font-medium
              text-white
              shadow-none
              hover:bg-[#36757B]
              hover:text-white
              focus:bg-[#43848A]
              focus:text-white
              active:bg-[#43848A]
              disabled:bg-[#43848A]
              disabled:text-white
              disabled:opacity-50
            '
          >
            Adicionar ao Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DOCUMENT_TYPE_OPTIONS: readonly {
  value: DocumentFileType
  label: string
}[] = [
  { value: ChecklistDocumentType.Pdf, label: 'PDF' },
  { value: ChecklistDocumentType.Docx, label: 'DOCX' },
  { value: ChecklistDocumentType.Image, label: 'Imagem' },
  { value: ChecklistDocumentType.Any, label: 'Qualquer' },
]

function toggleDocumentType(
  currentTypes: readonly DocumentFileType[],
  type: DocumentFileType,
): readonly DocumentFileType[] {
  if (type === ChecklistDocumentType.Any) {
    return [ChecklistDocumentType.Any]
  }

  const withoutAny = currentTypes.filter(
    (currentType) => currentType !== ChecklistDocumentType.Any,
  )

  const nextTypes = withoutAny.includes(type)
    ? withoutAny.filter((currentType) => currentType !== type)
    : [...withoutAny, type]

  return nextTypes.length > 0 ? nextTypes : []
}

function formatDocumentTypes(types: readonly DocumentFileType[]) {
  if (types.includes(ChecklistDocumentType.Any)) {
    return 'Qualquer'
  }

  return types.join(', ')
}
