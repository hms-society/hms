import type { PropsWithChildren } from 'react'

import { useAppLayout } from './use-app-layout'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isSidebarCollapsed, pathname, sidebarItems, handleSidebarToggle } =
    useAppLayout()

  return (
    <div className='flex min-h-screen bg-background font-sans text-foreground'>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        activePath={pathname}
        sidebarItems={sidebarItems}
      />

      <div className='flex min-h-screen min-w-0 flex-1 flex-col px-4 py-3 sm:px-6'>
        <Navbar />

        <div className='flex-1 pt-5 pb-8'>{children}</div>
      </div>
    </div>
  )
}
