import { Avatar, AvatarFallback, AvatarImage } from '@/ui/shadcn/avatar'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const Navbar = () => {
  return (
    <nav className='sticky top-3 z-30 flex h-12 items-center justify-between gap-4 rounded-full border border-brand/20 bg-hms-sidebar-foreground px-4 shadow-md'>
      <div className='mx-auto flex h-8 w-full max-w-[25rem] items-center gap-2 rounded-full bg-card px-3 text-brand shadow-xs'>
        <Icon name='search' className='size-3.5 shrink-0 text-brand/60' />
        <Input
          type='search'
          placeholder='Pesquisar por protocolo, documento...'
          className='h-full w-full border-none bg-transparent p-0 text-xs text-brand shadow-none placeholder:text-brand/50 focus-visible:border-none focus-visible:ring-0'
        />
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <button
          type='button'
          className='relative flex items-center justify-center rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40'
          title='Notificações'
        >
          <Icon name='bell' className='size-4' />
          <span className='absolute top-1 right-1 flex size-1.5'>
            <span className='relative inline-flex size-1.5 rounded-full bg-brand-accent' />
          </span>
        </button>

        <div className='h-5 w-px bg-white/20' />

        <button
          type='button'
          className='cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40'
        >
          <Avatar size='default' className='border border-white/20'>
            <AvatarImage
              src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
              alt='Usuário'
            />
            <AvatarFallback className='bg-brand-highlight text-xs font-sans text-white'>
              US
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </nav>
  )
}
