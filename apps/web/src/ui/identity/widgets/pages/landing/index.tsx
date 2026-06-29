import { Button } from '#/ui/shadcn/button'
import { Card, CardHeader, CardContent } from '#/ui/shadcn/card'
import { Calendar, Users, FileText, ShieldCheck, Scale, Clock, MessageSquare, MapPin, Phone, Mail} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex flex-col">
          <img src="/images/logo-hms.png" alt="HMS Sociedade de Advogados" className="w-20 h-auto" />
          <p className="text-brand font-serif text-[0.8rem] font-bold">
            Sociedade de Advogados
          </p>
        </div>
      <nav className="flex items-center gap-8">
        <a href="#sobre" className="hidden md:block text-brand font-serif text-[1rem] font-bold hover:opacity-75 transition-opacity">
          Sobre nós
        </a>
        <a href="#contato" className="hidden md:block text-brand font-serif text-[1rem] font-bold hover:opacity-75 transition-opacity">
          Contato
        </a>
        <Link to="/sign-up" className="text-brand font-serif text-[1rem] font-bold hover:opacity-75 transition-opacity">
          Login
        </Link>
      </nav>
      </header>
      <section className="relative overflow-hidden grid grid-cols-1 md:grid-cols-[4fr_3fr] px-8 md:px-18 pt-14 pb-14">
        <div className="flex flex-col gap-6 z-10">
          <h1 className="text-brand font-source text-[32px] md:text-[52px] font-semibold leading-tight tracking-[0.02em]">
            A plataforma que conecta pessoas, informação e resultados
          </h1>
          <div className="flex flex-col gap-3">
            <p className="text-gray-600 font-sans text-[15px] md:text-[20px] font-normal leading-normal max-w-md">
              Assessoria jurídica completa para pessoas físicas e empresas,
              com transparência em cada etapa do seu processo.
            </p>
            <p className="text-gray-600 font-sans text-[15px] md:text-[20px] font-normal leading-normal max-w-sm">
              Nossa equipe acompanha seu caso de perto, mantendo você
              informado e seguro em todas as decisões.
            </p>
          </div>
        <div>
          <Button className="flex items-center gap-2 bg-brand hover:bg-[#1a6b70] px-10 py-5 rounded-lg transition-colors cursor-pointer w-fit" asChild >
            <Link to="/">
              <Calendar className="w-6 h-6 text-white" />
              <span className="text-white font-serif text-[15px] font-bold">
                Agende sua Consulta
              </span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-8xl mt-25">
        <div className="flex flex-col gap-2">
          <div className="w-12 h-0.5 bg-brand" />
          <p className="font-sans text-[14px] lg:text-[18px] font-normal text-gray-600 leading-normal">
            Atuamos nas principais áreas do direito trabalhista, com expertise construída ao longo de mais de uma década de atuação
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-12 h-0.5 bg-brand" />
          <p className="font-sans text-[14px] lg:text-[18px] font-normal text-gray-600 leading-normal">
            Utilizamos tecnologia para manter você atualizado sobre cada movimentação do seu processo, com comunicação direta e ágil
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-12 h-0.5 bg-brand" />
          <p className="font-sans text-[14px] lg:text-[18px] font-normal text-gray-600 leading-normal">
            Atendimento personalizado e humanizado, porque cada caso é único e merece atenção dedicada
          </p>
        </div>
      </div>
        </div>
        <div className="absolute top-0 right-0 hidden md:block">
          <img src="/images/triangulos-landing.png" alt="Padrão de triângulos" className="w-[600px] h-auto object-contain"/>
        </div>
      </section>
      <section id="sobre" className="bg-brand px-8 md:px-24 py-15 pt-4 min-h-[85vh] flex flex-col justify-center">
        <h2 className="text-white text-[30px] md:text-[36px] font-bold mb-10">
          O que fazemos?
        </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"> 
      <Card className="bg-card-surface border-none">
      <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <Users className="w-6 h-6 text-brand shrink-0 mt-1" />
        <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
        Gestão da jornada do cliente
        </h3>
      </div>
      </CardHeader>
      <CardContent>
        <p className="font-sans text-[16px] text-gray-700 leading-normal">
        Organizamos todo o relacionamento jurídico, do primeiro contato à entrega final.
        </p>
      </CardContent>
      </Card>
      <Card className="bg-card-surface border-none">
      <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <FileText className="w-6 h-6 text-brand shrink-0 mt-1" />
        <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
        Produção documental inteligente
        </h3>
      </div>
      </CardHeader>
      <CardContent>
        <p className="font-sans text-[16px] text-gray-700 leading-normal">
        Geramos, revisamos e controlamos documentos com apoio de automação.
        </p>
      </CardContent>
      </Card>
      <Card className="bg-card-surface border-none">
      <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-1" />
        <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
        Execução com controle humano
        </h3>
      </div>
      </CardHeader>
      <CardContent>
        <p className="font-sans text-[16px] text-gray-700 leading-normal">
          A tecnologia acelera o processo, enquanto a equipe jurídica garante a qualidade.
        </p>
      </CardContent>
    </Card>
    <Card className="bg-card-surface border-none">
    <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <Scale className="w-6 h-6 text-brand shrink-0 mt-1" />
        <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
          Consultoria jurídica estratégica
        </h3>
      </div>
    </CardHeader>
    <CardContent>
        <p className="font-sans text-[16px] text-gray-700 leading-normal">
          Orientamos decisões com base em análise jurídica aprofundada e visão de negócio.
        </p>
    </CardContent>
    </Card>
    <Card className="bg-card-surface border-none">
    <CardHeader className="pb-2">
      <div className="flex items-start gap-3">
        <Clock className="w-6 h-6 text-brand shrink-0 mt-1" />
        <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
          Acompanhamento em tempo real
        </h3>
      </div>
    </CardHeader>
    <CardContent>
      <p className="font-sans text-[16px] text-gray-700 leading-normal">
      Monitore cada etapa do seu processo com atualizações automáticas e transparentes.
      </p>
    </CardContent>
    </Card>
    <Card className="bg-card-surface border-none">
    <CardHeader className="pb-2">
    <div className="flex items-start gap-3">
      <MessageSquare className="w-6 h-6 text-brand shrink-0 mt-1" />
      <h3 className="text-[16px] lg:text-[18px] font-bold text-brand">
      Comunicação direta e ágil
      </h3>
    </div>
    </CardHeader>
    <CardContent>
      <p className="font-sans text-[16px] text-gray-700 leading-normal">
        Canal direto com sua equipe jurídica, sem burocracia e com respostas rápidas.
      </p>
    </CardContent>
    </Card>
    </div>
    </section>
    <footer id="contato" className="bg-white py-24 flex flex-col min-h-[65vh]">
      <div className="px-10 md:px-24 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
      <div className="flex flex-col gap-8">
        <p className="text-brand font-serif text-sm font-semibold tracking-widest uppercase">
          Estamos prontos para te ajudar
        </p>
        <h2 className="text-brand text-[38px] md:text-[48px] font-bold leading-tight">
          Fale com um de nossos advogados
        </h2>
        <p className="font-sans text-[18px] font-normal text-gray-500 leading-relaxed">
          Agende uma consulta e descubra como podemos cuidar do seu caso com dedicação e transparência.
        </p>
        <Button variant="outline" className="w-fit px-12 py-6 rounded-full border-2 border-brand text-brand font-serif text-lg font-bold hover:bg-brand hover:text-white transition-colors cursor-pointer"
          onClick={() =>
          window.open("https://wa.me/5511", "_blank")
        }>
          Contate-nos
        </Button>
      </div>
    <div className="flex flex-col gap-4">
        <h4 className="text-[18px] font-bold text-brand">
          Endereço
        </h4>
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-brand mt-0.5 shrink-0" />
        <p className="font-sans text-[14px] text-gray-600 leading-relaxed">
          Av. Paulista, 1000, Sala 301 / São Paulo – SP,<br />
          01310-100 / Brasil
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Phone className="w-5 h-5 text-brand shrink-0" />
        <p className="font-sans text-[14px] text-gray-600">
          +55 (11) 3456-7890
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Mail className="w-5 h-5 text-brand shrink-0" />
        <p className="font-sans text-[14px] text-gray-600">
          contato@hmsadvogados.com.br
        </p>
      </div>
    </div>
  </div>
  </footer>
  <div className="bg-white px-8 md:px-24 py-8 flex items-center justify-between border-t border-gray-200">
    <p className="font-sans text-[10px] md:text-[14px] text-gray-500">
    © 2026 HMS Sociedade de Advogados. Todos os direitos reservados.
    </p>
  <div className="flex items-center gap-2">
    <Link to="/" className="font-sans text-[10px] md:text-[14px] text-gray-500 hover:text-brand transition-colors">
      Política de Privacidade
    </Link>
    <Link to="/" className="font-sans text-[10px] md:text-[14px] text-gray-500 hover:text-brand transition-colors">
      Termos de Uso
    </Link>
  </div>
</div>
</div>
  
)
}
