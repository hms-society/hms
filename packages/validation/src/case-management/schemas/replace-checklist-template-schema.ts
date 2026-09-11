import { z } from 'zod'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'

export const replaceChecklistTemplateSchema = z
  .object({
    checklistTemplateId: z.uuid().optional(),
    legalAreaId: z.uuid(),
    name: z.string().trim().min(1),
    isActive: z.boolean(),
    items: z.array(
      z.object({
        title: z.string().trim().min(1),
        documentTypes: z.array(z.enum(ChecklistDocumentType)).min(1),
        isRequired: z.boolean(),
        position: z.number().int().min(0),
      }),
    ),
  })
  .refine(
    (template) =>
      template.items.every(
        (item) =>
          !item.documentTypes.includes(ChecklistDocumentType.Any) ||
          item.documentTypes.length === 1,
      ),
    {
      message: 'Qualquer deve ser o único tipo aceito quando selecionado.',
      path: ['items'],
    },
  )
