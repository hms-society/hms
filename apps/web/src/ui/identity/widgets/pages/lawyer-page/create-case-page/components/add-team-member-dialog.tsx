import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/ui/shadcn/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useCollaboratorsQuery } from '@/ui/identity/hooks/use-collaborators-query'
export type TeamMember = {
  collaboratorId: string
  name: string
  role: string
  permission: string
}

export type AddTeamMemberDialogProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (member: TeamMember) => void
}

export function AddTeamMemberDialog({
  isOpen,
  onClose,
  onAdd,
}: AddTeamMemberDialogProps) {
  const [collaboratorId, setCollaboratorId] = useState('')
  const [role, setRole] = useState<TeamMember['role'] | ''>('')
  const [permission, setPermission] = useState<TeamMember['permission'] | ''>('')
  const [collabOpen, setCollabOpen] = useState(false)
  const [collabSearch, setCollabSearch] = useState('')
  const { collaboratorsPage, isLoadingCollaborators } = useCollaboratorsQuery({
    pageSize: 50,
    search: collabSearch,
  })
  const collaborators = collaboratorsPage?.items ?? []
  const selectedCollaborator = collaborators.find(
    (c) => c.collaboratorId === collaboratorId,
  )
  const handleAdd = () => {
    if (!collaboratorId || !role || !permission) return
    onAdd({
      collaboratorId,
      role,
      permission,
      name: selectedCollaborator?.professionalName ?? '',
    })
    setCollaboratorId('')
    setRole('')
    setPermission('')
    onClose()
  }

  const handleClose = () => {
    setCollaboratorId('')
    setRole('')
    setPermission('')
    setCollabSearch('')
    onClose()
  }

  const isFormValid = !!collaboratorId && !!role && !!permission
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className='sm:max-w-[480px] sm:rounded-[16px] p-0 overflow-hidden'
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className='p-6'>
          <DialogHeader className='mb-4 flex flex-row items-center justify-between'>
            <DialogTitle className='font-serif text-xl font-semibold text-teal-900'>
              Adicionar Membro à Equipe
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label className='text-[13px] font-semibold text-muted-foreground'>
                Funcionário<span className='text-destructive'>*</span>
              </Label>
              <Popover open={collabOpen} onOpenChange={setCollabOpen}>
                <PopoverTrigger asChild>
                  <div className='relative w-full cursor-pointer'>
                    <Input
                      placeholder='Buscar usuário interno...'
                      value={
                        collabOpen
                          ? collabSearch
                          : selectedCollaborator
                            ? selectedCollaborator.professionalName
                            : collabSearch
                      }
                      onChange={(e) => {
                        if (selectedCollaborator && !collabOpen) {
                          setCollaboratorId('')
                        }
                        setCollabSearch(e.target.value)
                        setCollabOpen(true)
                      }}
                      onClick={() => setCollabOpen(true)}
                      className='h-10 rounded-lg shadow-sm pl-10 cursor-pointer'
                      readOnly={!collabOpen && !!selectedCollaborator}
                    />
                    <Icon
                      name='search'
                      className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className='w-[var(--radix-popover-trigger-width)] p-0 rounded-xl max-h-[250px]'
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command shouldFilter={false}>
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCollaborators
                          ? 'Buscando...'
                          : 'Nenhum usuário encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {collaborators.map((c) => (
                          <CommandItem
                            key={c.collaboratorId}
                            value={`${c.collaboratorId} ${c.professionalName}`}
                            onSelect={() => {
                              setCollaboratorId(c.collaboratorId)
                              setCollabSearch('')
                              setCollabOpen(false)
                            }}
                          >
                            <Icon
                              name='check'
                              className={`mr-2 size-4 ${
                                collaboratorId === c.collaboratorId
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            />
                            <span className='truncate'>{c.professionalName}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-2'>
              <Label className='text-[13px] font-semibold text-muted-foreground'>
                Cargo <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as TeamMember['role'])}
              >
                <SelectTrigger className='h-10 rounded-lg shadow-sm'>
                  <SelectValue placeholder='Selecione o cargo...' />
                </SelectTrigger>
                <SelectContent className='rounded-xl'>
                  <SelectItem value='lawyer' className='rounded-lg'>
                    Advogado Auxiliar
                  </SelectItem>
                  <SelectItem value='paralegal' className='rounded-lg'>
                    Paralegal
                  </SelectItem>
                  <SelectItem value='intern' className='rounded-lg'>
                    Estagiário
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label className='text-[13px] font-semibold text-muted-foreground'>
                Nível de Permissão <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={permission}
                onValueChange={(val) => setPermission(val as TeamMember['permission'])}
              >
                <SelectTrigger className='h-10 rounded-lg shadow-sm'>
                  <SelectValue placeholder='Selecione a permissão...' />
                </SelectTrigger>
                <SelectContent className='rounded-xl'>
                  <SelectItem value='visualização' className='rounded-lg'>
                    Visualização
                  </SelectItem>
                  <SelectItem value='edição' className='rounded-lg'>
                    Edição
                  </SelectItem>
                  <SelectItem value='execução' className='rounded-lg'>
                    Execução
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full bg-[#F5F4F0] p-6 rounded-b-[16px]'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            className='w-full sm:w-1/2 rounded-full h-11 border-teal-700 text-teal-800 hover:bg-teal-50 bg-transparent text-[15px]'
          >
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={handleAdd}
            disabled={!isFormValid}
            className='w-full sm:w-1/2 rounded-full h-11 bg-[#7CB3AA] hover:bg-[#689E95] text-white border-transparent text-[15px]'
          >
            Adicionar à Equipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
