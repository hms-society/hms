import { z } from 'zod';

export const teamMemberSchema = z.object({
  collaboratorId: z.string().min(1, 'Selecione um membro'),
  role: z.enum(['lead_lawyer', 'lawyer', 'paralegal', 'supervisor', 'intern'], { message: 'Função inválida' }),
  permission: z.enum(['execução', 'visualização', 'edição'], { message: 'Permissão inválida' }),
});

export const createCaseSchema = z.object({
  title: z.string().min(1, 'O título do caso é obrigatório'),
  intakeId: z.string().min(1, 'Selecione uma triagem de origem'),
  legalAreaId: z.string().min(1, 'Selecione uma área do direito'),
  legalTopicId: z.string().min(1, 'Selecione um tema'),
  description: z.string().optional(),
  team: z.array(teamMemberSchema),
});

export type CreateCaseData = z.infer<typeof createCaseSchema>;
