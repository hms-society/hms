import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import type { DynamicFormFieldListProps } from './types'
import { DynamicFormFieldRow } from './dynamic-form-field-row'
import { useDynamicFormFieldList } from './use-dynamic-form-field-list'

export function DynamicFormFieldList({
  fields,
  preview,
  onEdit,
  onRemove,
  onMove,
}: DynamicFormFieldListProps) {
  const controller = useDynamicFormFieldList({ fields, onEdit, onRemove, onMove })
  return (
    <Tabs defaultValue='fields'>
      <Card className='border border-border shadow-2xs'>
        <CardHeader className='gap-3 px-5 py-4'>
          <div className='flex items-center justify-between gap-3'>
            <h2 id='fields-heading' className='text-sm font-semibold'>
              <span className='flex items-center gap-2'>
                <Icon name='list-ordered' className='size-4 text-muted-foreground' />
                Campos do formulário ({fields.length})
              </span>
            </h2>
            <Button
              type='button'
              size='sm'
              className='rounded-full'
              onClick={() => onEdit('')}
            >
              <Icon name='plus' /> Adicionar campo
            </Button>
          </div>
          <TabsList variant='line' className='w-fit'>
            <TabsTrigger value='fields'>Campos</TabsTrigger>
            <TabsTrigger value='preview'>Pré-visualização</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className='px-5 pb-5 pt-0'>
          <TabsContent value='fields' className='mt-0'>
            {fields.length === 0 ? (
              <div className='rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground'>
                Nenhum campo adicionado. Comece adicionando um campo.
              </div>
            ) : (
              <DndContext
                sensors={controller.sensors}
                collisionDetection={controller.collisionDetection}
                accessibility={{
                  announcements: controller.announcements,
                  screenReaderInstructions: controller.screenReaderInstructions,
                }}
                onDragStart={controller.onDragStart}
                onDragCancel={controller.onDragCancel}
                onDragEnd={controller.onDragEnd}
              >
                <SortableContext
                  items={fields.map((field) => field.clientId)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol
                    className='divide-y divide-border border-t border-border'
                    aria-label='Campos ordenados'
                  >
                    {fields.map((field, index) => (
                      <DynamicFormFieldRow
                        key={field.clientId}
                        field={field}
                        index={index}
                        count={fields.length}
                        onEdit={() => onEdit(field.clientId)}
                        onRemove={() => onRemove(field.clientId)}
                        onMove={(target) => onMove(field.clientId, target)}
                      />
                    ))}
                  </ol>
                </SortableContext>
                <div className='sr-only' aria-live='polite'>
                  {controller.activeId ? 'Reordenando campo' : ''}
                </div>
              </DndContext>
            )}
          </TabsContent>
          {preview && (
            <TabsContent value='preview' className='mt-0'>
              {preview}
            </TabsContent>
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
}
