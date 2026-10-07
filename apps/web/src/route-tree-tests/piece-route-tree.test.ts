import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('piece workflow route tree', () => {
  it('nests piece routes under the authenticated lawyer layout', () => {
    const routeTree = readFileSync(resolve(process.cwd(), 'src/routeTree.gen.ts'), 'utf8')
    const routeBlock = routeTree.match(
      /const AdvogadoMeusCasosCaseIdPecasDocumentIdRouteRoute =([\s\S]*?)\nconst /,
    )?.[1]
    const caseRouteBlock = routeTree.match(
      /const AdvogadoMeusCasosCaseIdRoute =([\s\S]*?)\nconst /,
    )?.[1]

    expect(routeBlock).toContain('getParentRoute: () => AdvogadoMeusCasosCaseIdRoute')
    expect(routeBlock).not.toContain('getParentRoute: () => rootRouteImport')
    expect(caseRouteBlock).toContain('getParentRoute: () => AdvogadoRouteRoute')
  })
})
