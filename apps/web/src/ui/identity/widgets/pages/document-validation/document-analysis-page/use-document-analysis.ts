import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { documentReview, type DocumentReviewFormData } from '../schemas/schema'

const MOCK_DOCUMENTS = [
  { id: '1', fileName: 'comprovante-residencia.pdf', confidence: 'Alta confiança', type: 'comprovante_residencia' },
  { id: '2', fileName: 'extrato-bancario.pdf', confidence: 'Alta confiança', type: 'extrato_bancario' },
  { id: '3', fileName: 'rg-frente-verso.jpg', confidence: 'Baixa confiança', type: 'rg' },
  { id: '4', fileName: 'contrato-social.pdf', confidence: 'Média confiança', type: 'contrato_social' },
  { id: '5', fileName: 'declaracao-hipossuficiencia.pdf', confidence: 'Alta confiança', type: 'declaracao_hipossuficiencia' },
  { id: '6', fileName: 'procuracao-assinada.pdf', confidence: 'Média confiança', type: 'procuracao' },
]

export const useDocumentAnalysis = ({ fileId }: { fileId: string }) => {  
  const { navigateTo } = useNavigation()

  const mockDocument = MOCK_DOCUMENTS.find(doc => doc.id === fileId) || {
    id: fileId,
    fileName: 'documento-desconhecido.pdf',
    confidence: 'Alta confiança',
    type: ''
  }

  const form = useForm<DocumentReviewFormData>({
    resolver: zodResolver(documentReview),
    mode: 'onTouched',
    defaultValues: {
      decision: 'validate',
      documentTypeId: mockDocument.type,
      checklistRequirementId: '',
      reason: '',
      originalDocumentId: '',
    },
  })

  const currentDecision = form.watch('decision')

  const { mutateAsync: submitReview, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: DocumentReviewFormData) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return { fileId, ...data }
    },
    onSuccess: () => {
      toast.success('Documento revisado com sucesso.')
      navigateTo('documentInbox')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao processar a validação do documento.')
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    await submitReview(data)
  })

  return {
    form,
    currentDecision,
    isSubmitting,
    onSubmit,
    mockDocument,
  }
}