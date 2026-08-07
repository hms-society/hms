import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'

export const HomePage = () => {
  return (
    <AppLayout>
      <div className='flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto'>
        <PageTitle className='mb-4 md:text-5xl'>Bem-vindo ao HMS</PageTitle>
        <p className='text-muted-foreground font-sans text-base leading-relaxed'>
          Você foi autenticado com sucesso e agora está no painel principal da plataforma
          HMS Sociedade de Advogados. Use o menu lateral à esquerda para navegar e a barra
          de busca na barra inferior para localizar protocolos e documentos.
        </p>
      </div>
    </AppLayout>
  )
}
