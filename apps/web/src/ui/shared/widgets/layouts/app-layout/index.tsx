import type { PropsWithChildren } from 'react'

import { useAppLayout } from './use-app-layout'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'
import { CommunicationProvider } from '@/ui/shared/contexts/communication-context'

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isSidebarCollapsed, pathname, sidebarItems, handleSidebarToggle } =
    useAppLayout()

  return (
    <CommunicationProvider>
      <div className='flex min-h-screen bg-background text-foreground font-sans'>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          activePath={pathname}
          sidebarItems={sidebarItems}
        />

        <main className='relative flex min-h-screen min-w-0 flex-1 flex-col'>
          <Navbar />

          <div className='flex-1 flex flex-col px-6 pt-28 pb-8 sm:px-12'>{children}</div>
        </main>
      </div>
    </CommunicationProvider>
  )
}
