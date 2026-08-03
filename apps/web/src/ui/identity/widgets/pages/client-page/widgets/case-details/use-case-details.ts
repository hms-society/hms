import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

export function useCaseDetails() {
  const { caseId } = useParams({ from: '/cliente/meus-casos/$caseId' })
  const { intakeService } = useRestContext()

  const {
    data: caseDetails,
    error: caseDetailsError,
    isLoading: isLoadingCaseDetails,
  } = useQuery({
    queryKey: ['intake', caseId],
    queryFn: async () => {
      const response = await intakeService.getIntake(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: !!caseId,
  })

  // Mapping IntakeStatus to stepper index
  const getActiveStepIndex = (status?: IntakeStatus): number => {
    if (!status) return 0
    switch (status) {
      case IntakeStatus.Registered:
        return 0
      case IntakeStatus.ConsultationScheduled:
      case IntakeStatus.ConsultationCompleted:
        return 1
      case IntakeStatus.ViabilityRegistered:
        return 2
      case IntakeStatus.InFormalization:
        return 3
      case IntakeStatus.Contracted:
        return 4
      case IntakeStatus.ClosedWithoutContract:
        return 5
      default:
        return 0
    }
  }

  const steps = [
    { label: 'Registro do Caso', description: 'Dados cadastrados' },
    { label: 'Consulta', description: 'Agenda/Realizada' },
    { label: 'Viabilidade', description: 'Análise técnica' },
    { label: 'Formalização', description: 'Contrato e termos' },
    { label: 'Contratado', description: 'Processo iniciado' },
  ]

  const activeStep = getActiveStepIndex(caseDetails?.status)

  // Document list based on current status and area
  const getDocuments = () => {
    const hasPendency =
      caseDetails?.status === IntakeStatus.Registered ||
      caseDetails?.status === IntakeStatus.ViabilityRegistered

    return [
      {
        name: 'Documento de Identidade (RG/CNH)',
        status: 'approved',
        updatedAt: '2026-07-28',
      },
      { name: 'Comprovante de Residência', status: 'approved', updatedAt: '2026-07-28' },
      {
        name: 'Procuração Assinada',
        status: caseDetails?.status === IntakeStatus.Registered ? 'pending' : 'approved',
        updatedAt: '2026-07-29',
      },
      {
        name: 'Contrato de Honorários',
        status: activeStep >= 3 || !hasPendency ? 'approved' : 'pending',
        updatedAt: '2026-07-29',
      },
      {
        name: 'Declaração de Hipossuficiência',
        status: hasPendency ? 'pending' : 'approved',
        updatedAt: '-',
      },
    ]
  }

  // Vertical timeline
  const getTimeline = () => {
    const timeline = [
      {
        date: '28/07/2026',
        time: '14:32',
        title: 'Caso registrado',
        desc: 'Sua solicitação de atendimento foi recebida pelo escritório.',
      },
    ]

    if (caseDetails?.status !== IntakeStatus.Registered) {
      timeline.unshift({
        date: '29/07/2026',
        time: '10:00',
        title: 'Consulta Jurídica agendada',
        desc: 'Sua reunião inicial com nossos advogados foi agendada.',
      })
    }

    if (activeStep >= 2) {
      timeline.unshift({
        date: '29/07/2026',
        time: '16:45',
        title: 'Análise de Viabilidade iniciada',
        desc: 'A equipe jurídica está avaliando os documentos e dados fornecidos.',
      })
    }

    if (activeStep >= 4) {
      timeline.unshift({
        date: '30/07/2026',
        time: '09:00',
        title: 'Processo Contratado',
        desc: 'Parabéns! O contrato foi assinado e a petição está em fase de elaboração.',
      })
    }

    return timeline
  }

  // Messages from the firm
  const getMessages = () => {
    return [
      {
        sender: 'Dra. Patrícia Silva',
        role: 'Advogada Responsável',
        date: 'Hoje, às 09:15',
        content:
          'Olá! Analisei as notas do seu caso. Precisamos que nos envie a declaração de hipossuficiência assinada para dar andamento gratuito se for o caso.',
      },
      {
        sender: 'Secretaria HMS',
        role: 'Atendimento',
        date: 'Ontem, às 14:00',
        content:
          'Seja bem-vindo(a) ao HMS. Caso tenha dúvidas sobre a documentação exigida, você pode mandar mensagem diretamente por este canal.',
      },
    ]
  }

  return {
    caseId,
    caseDetails,
    steps,
    activeStep,
    documents: getDocuments(),
    timeline: getTimeline(),
    messages: getMessages(),
    error: caseDetailsError,
    isLoading: isLoadingCaseDetails,
  }
}
