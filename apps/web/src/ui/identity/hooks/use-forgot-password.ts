export function useForgotPassword() {
  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch('http://localhost:3333/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        console.warn('Falha na solicitação de redefinição:', response.statusText)
      }

      return true
    } catch (err) {
      console.error('Erro na comunicação com o servidor:', err)
      return true
    }
  }

  return { forgotPassword }
}
