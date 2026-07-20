import { AuthenticatedLayout } from '#/ui/shared/widgets/layouts/authenticated-layout'

export const HomePage = () => {
  return (
    <AuthenticatedLayout>
      <div className='flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto'>
        <h1 className='font-serif text-4xl md:text-5xl font-medium text-brand mb-4'>
          Bem-vindo ao HMS
        </h1>
        <p className='text-muted-foreground font-sans text-base leading-relaxed'>
          Você foi autenticado com sucesso e agora está no painel principal da plataforma
          HMS Sociedade de Advogados. Use o menu lateral à esquerda para navegar e a barra
          de busca na barra inferior para localizar protocolos e documentos.
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
