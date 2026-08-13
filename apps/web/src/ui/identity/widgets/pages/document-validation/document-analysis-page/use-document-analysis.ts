import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { documentReview, type DocumentReviewFormData } from '../schemas/schema'

const MOCK_DOCUMENTS = [
  { id: '1', fileName: 'comprovante-residencia.pdf', confidence: 'Alta confiança', type: 'comprovante_residencia', fileSize: '2.4 MB', receivedFrom: 'Mariana Costa Silva', contactInfo: 'E-mail - mariana.silva@email.com', receivedDate: 'Hoje', receivedTime: '14:32', integrity: 'Confirmada', duplicity: 'Nenhuma correspondência', status: 'Aguardando validação' },
  { id: '2', fileName: 'extrato-bancario.pdf', confidence: 'Alta confiança', type: 'extrato_bancario', fileSize: '1.1 MB', receivedFrom: 'João Paulo Mendes', contactInfo: 'WhatsApp - +55 21 99876-5432', receivedDate: 'Hoje', receivedTime: '13:08', integrity: 'Confirmada', duplicity: 'Nenhuma correspondência', status: 'Validado' },
  { id: '3', fileName: 'rg-frente-verso.jpg', confidence: 'Baixa confiança', type: 'rg', fileSize: '3.8 MB', receivedFrom: 'Ana Beatriz Lima', contactInfo: 'E-mail - ana.lima@email.com', receivedDate: 'Ontem', receivedTime: '17:45', integrity: 'Falha', duplicity: 'Possível duplicidade', status: 'Ilegível' },
  { id: '4', fileName: 'contrato-social.pdf', confidence: 'Média confiança', type: 'contrato_social', fileSize: '890 KB', receivedFrom: 'Alvorada Serviços Ltda.', contactInfo: 'Portal do cliente - documentos@alvorada.com.br', receivedDate: 'Ontem', receivedTime: '16:20', integrity: 'Confirmada', duplicity: 'Nenhuma correspondência', status: 'Incompleto' },
  { id: '5', fileName: 'declaracao-hipossuficiencia.pdf', confidence: 'Alta confiança', type: 'declaracao_hipossuficiencia', fileSize: '620 KB', receivedFrom: 'Rafael Nunes', contactInfo: 'Portal do cliente - rafael.nunes@email.com', receivedDate: 'Ontem', receivedTime: '15:02', integrity: 'Confirmada', duplicity: 'Duplicado', status: 'Duplicado' },
  { id: '6', fileName: 'procuracao-assinada.pdf', confidence: 'Média confiança', type: 'procuracao', fileSize: '740 KB', receivedFrom: 'Cláudia Ferreira', contactInfo: 'WhatsApp - +55 11 98765-1098', receivedDate: '05/08/2026', receivedTime: '11:26', integrity: 'Confirmada', duplicity: 'Nenhuma correspondência', status: 'Falha no processamento' },
]

const mapStatusToDecision = (status: string): DocumentReviewFormData['decision'] => {
  switch (status) {
    case 'Ilegível': return 'illegible'
    case 'Incompleto': return 'incomplete'
    case 'Duplicado': return 'duplicate'
    default: return 'validate'
  }
}

export const useDocumentAnalysis = ({ fileId }: { fileId: string }) => {
  const { navigateTo } = useNavigation()
  const [isResendModalOpen, setIsResendModalOpen] = useState(false)

  const mockDocument = MOCK_DOCUMENTS.find(doc => doc.id === fileId) || {
    id: fileId,
    fileName: 'documento-desconhecido.pdf',
    confidence: 'Sugerido pela IA',
    type: '',
    fileSize: '0 KB',
    receivedFrom: 'Desconhecido',
    contactInfo: 'N/A',
    receivedDate: 'N/A',
    receivedTime: 'N/A',
    integrity: 'Pendente',
    duplicity: 'Pendente',
    status: 'Aguardando validação'
  }

  const form = useForm<DocumentReviewFormData>({
    resolver: zodResolver(documentReview),
    mode: 'onTouched',
    defaultValues: {
      decision: mapStatusToDecision(mockDocument.status),
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

  const handleRequestResend = () => setIsResendModalOpen(true)
  const handleCloseResendModal = () => setIsResendModalOpen(false)

  const handleConfirmResend = (message: string) => {
    setIsResendModalOpen(false)
    toast.success('Solicitação de reenvio encaminhada com sucesso.')
  }

  return {
    form,
    currentDecision,
    isSubmitting,
    isResendModalOpen,
    onSubmit,
    handleRequestResend,
    handleCloseResendModal,
    handleConfirmResend,
    mockDocument,
  }
}