import { useEffect, useState } from 'react'

type UseRequestResendModalProps = {
  recipientName: string
  onSend: (message: string) => void
}

export function useRequestResendModal({
  recipientName,
  onSend,
}: UseRequestResendModalProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const firstName = recipientName.trim().split(' ')[0] || 'cliente'
    setMessage(
      `Olá, ${firstName}. O documento enviado está incompleto. Por favor, encaminhe um novo arquivo com todos os dados obrigatórios para continuarmos a validação.`,
    )
  }, [recipientName])

  function handleMessageChange(value: string) {
    setMessage(value)
  }

  function handleSend() {
    onSend(message)
  }

  return { message, handleMessageChange, handleSend }
}
