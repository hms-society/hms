import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateClientSchema } from '@hms/validation/identity'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Card, CardContent } from '@/ui/shadcn/card'
import { toast } from 'sonner'
import { AuditConfirmationModal } from '@/ui/identity/widgets/components/audit-confirmation-modal'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useUpdateClientAction } from '@/ui/identity/hooks/use-update-client-action'

export type ClientRegistrationDataTabProps = {
  clientId: string
  initialData: any 
}

export function ClientRegistrationDataTab({ clientId, initialData }: ClientRegistrationDataTabProps) {
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const { updateClient, isUpdatingClient } = useUpdateClientAction()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDuplicityConflict, setIsDuplicityConflict] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<any>(null)

  const isAttendant = currentCollaborator?.profile === 'attendant'

  const form = useForm({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      type: initialData.type,
      name: initialData.name || '',
      legalName: initialData.legalName || '',
      tradeName: initialData.tradeName || '',
      taxId: initialData.taxId || { type: '', value: '' },
      email: initialData.email || '',
      phone: initialData.phone || '',
      address: initialData.address || {
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
      },
    },
  })

  const onSubmit = (data: any) => {
    setPendingChanges(data)
    setIsDuplicityConflict(false)
    setIsModalOpen(true)
  }

  const handleConfirm = async (justification?: string) => {
    try {
      await updateClient({
        clientId,
        changes: { ...pendingChanges, duplicityOverrideJustification: justification },
      })
      toast.success('Dados atualizados com sucesso.')
      setIsModalOpen(false)
      setPendingChanges(null)
    } catch (error: any) {
      const isConflict = 
        error?.name === 'ConflictError' || 
        error?.title === 'Erro de Conflito' || 
        error?.message?.includes('Documento já cadastrado') ||
        error?.response?.status === 409
        
      if (isConflict) {
        setIsDuplicityConflict(true)
      } else {
        toast.error('Falha ao atualizar dados.')
        setIsModalOpen(false)
      }
    }
  }

  return (
    <div className='flex flex-col gap-4 py-4'>
      <Card>
        <CardContent className='p-6'>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            
            <h3 className='font-semibold text-lg'>Dados Pessoais</h3>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {initialData.type === 'natural' ? (
                <div className='space-y-2'>
                  <Label>Nome Completo</Label>
                  <Input {...form.register('name')} disabled={isAttendant} />
                </div>
              ) : (
                <>
                  <div className='space-y-2'>
                    <Label>Razão Social</Label>
                    <Input {...form.register('legalName')} disabled={isAttendant} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Nome Fantasia</Label>
                    <Input {...form.register('tradeName')} disabled={isAttendant} />
                  </div>
                </>
              )}
              
              <div className='space-y-2'>
                <Label>{initialData.type === 'natural' ? 'CPF' : 'CNPJ'}</Label>
                <Input {...form.register('taxId.value')} disabled={isAttendant} />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input {...form.register('email')} type='email' />
              </div>
              <div className='space-y-2'>
                <Label>Telefone</Label>
                <Input {...form.register('phone')} />
              </div>
            </div>

            <h3 className='font-semibold text-lg mt-6'>Endereço</h3>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>CEP</Label>
                <Input {...form.register('address.zipCode')} />
              </div>
              <div className='space-y-2'>
                <Label>Logradouro</Label>
                <Input {...form.register('address.street')} />
              </div>
              <div className='space-y-2'>
                <Label>Número</Label>
                <Input {...form.register('address.number')} />
              </div>
              <div className='space-y-2'>
                <Label>Complemento</Label>
                <Input {...form.register('address.complement')} />
              </div>
              <div className='space-y-2'>
                <Label>Bairro</Label>
                <Input {...form.register('address.district')} />
              </div>
              <div className='space-y-2'>
                <Label>Cidade</Label>
                <Input {...form.register('address.city')} />
              </div>
              <div className='space-y-2'>
                <Label>UF</Label>
                <Input {...form.register('address.state')} />
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button type='submit' disabled={isUpdatingClient} className='rounded-full'>
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AuditConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        isDuplicityConflict={isDuplicityConflict}
        isPending={isUpdatingClient}
      />
    </div>
  )
}