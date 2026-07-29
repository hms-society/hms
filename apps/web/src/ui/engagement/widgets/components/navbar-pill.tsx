import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '#/ui/shadcn/avatar'
import { Input } from '#/ui/shadcn/input'

export const NavbarPill = () => {
  return (
    <nav className='mt-6 mx-auto z-50 flex items-center justify-between w-[1127px] max-w-[calc(100%-3rem)] h-[68px] px-5 rounded-[50px] bg-hms-sidebar-foreground shadow-[0_4px_4px_0_rgba(19,76,80,0.25)] border border-[#134C50]/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 transition-all'>
      {/* Esquerda: Barra de Pesquisa */}
      <div className='flex w-[400px] max-w-[60%] h-10 px-[14px] items-center gap-[10px] shrink rounded-[20px] bg-white text-[#134C50] shadow-xs m-auto'>
        <Search className='w-5 h-5 text-[#134C50]/60 shrink-0' />
        <Input
          type='search'
          placeholder='Pesquisar Protocolo, documento...'
          className='border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-none p-0 h-full w-full text-[#134C50] placeholder:text-[#134C50]/50'
        />
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='button'
          className='relative flex items-center justify-center p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40'
          title='Notificações'
        >
          <Bell className='w-5 h-5' />
          <span className='absolute top-1.5 right-1.5 flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75' />
            <span className='relative inline-flex rounded-full h-2 w-2 bg-brand-accent' />
          </span>
        </button>

        <div className='h-6 w-px bg-white/20' />

        <button
          type='button'
          className='outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full cursor-pointer hover:opacity-90 transition-opacity'
        >
          <Avatar size='default' className='border border-white/20'>
            <AvatarImage
              src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
              alt='Usuário'
            />
            <AvatarFallback className='bg-white/10 text-white font-sans text-xs'>
              US
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </nav>
  )
}
