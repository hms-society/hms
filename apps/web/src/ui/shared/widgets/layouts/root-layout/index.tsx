import type { PropsWithChildren } from 'react'

import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

import { AuthContextProvider } from '@/ui/shared/contexts/auth-context'
import { RestContextProvider } from '@/ui/shared/contexts/rest-context'
import { Toaster } from '@/ui/shadcn/sonner'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'light';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

const queryClient = new QueryClient()

export type RootLayoutProps = PropsWithChildren

export const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AuthContextProvider>
          <RestContextProvider>
            <html lang='pt-BR' suppressHydrationWarning>
              <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
                <HeadContent />
              </head>
              <body className='antialiased [overflow-wrap:anywhere]'>
                {children}
                <Toaster />
                <TanStackDevtools
                  config={{
                    position: 'bottom-right',
                  }}
                  plugins={[
                    {
                      name: 'Tanstack Router',
                      render: <TanStackRouterDevtoolsPanel />,
                    },
                  ]}
                />
                <Scripts />
              </body>
            </html>
          </RestContextProvider>
        </AuthContextProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
