import { Extension } from '@tiptap/react'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export type PendingMarkerExtensionOptions = {
  terms: readonly string[]
}

export const pendingMarkerPluginKey = new PluginKey<readonly string[]>(
  'hms-pending-markers',
)

export function normalizePendingMarkerTerms(terms: readonly string[]) {
  return [...new Set(terms.filter((term) => term.trim().length > 0))]
}

function createPendingMarkerDecorations(
  document: Parameters<typeof DecorationSet.create>[0],
  terms: readonly string[],
) {
  const decorations: Decoration[] = []
  const normalizedTerms = normalizePendingMarkerTerms(terms)

  if (normalizedTerms.length === 0) return DecorationSet.empty

  document.descendants((node, position) => {
    if (!node.isText || !node.text) return

    for (const term of normalizedTerms) {
      let startIndex = node.text.indexOf(term)
      while (startIndex >= 0) {
        const from = position + startIndex
        const to = from + term.length
        decorations.push(
          Decoration.inline(from, to, {
            class:
              'bg-highlight/60 text-foreground underline decoration-highlight-vivid decoration-2 underline-offset-2',
            'data-pending-marker': 'true',
          }),
        )
        startIndex = node.text.indexOf(term, startIndex + term.length)
      }
    }
  })

  return DecorationSet.create(document, decorations)
}

export const PendingMarkerExtension = Extension.create<PendingMarkerExtensionOptions>({
  name: 'pendingMarker',

  addOptions() {
    return { terms: [] }
  },

  addProseMirrorPlugins() {
    const initialTerms = normalizePendingMarkerTerms(this.options.terms)

    return [
      new Plugin<readonly string[]>({
        key: pendingMarkerPluginKey,
        state: {
          init: () => initialTerms,
          apply(transaction, terms) {
            const nextTerms = transaction.getMeta(pendingMarkerPluginKey)
            return nextTerms === undefined
              ? terms
              : normalizePendingMarkerTerms(nextTerms)
          },
        },
        props: {
          decorations(state) {
            return createPendingMarkerDecorations(
              state.doc,
              pendingMarkerPluginKey.getState(state) ?? [],
            )
          },
        },
      }),
    ]
  },
})

export function createPendingMarkerExtension(terms: readonly string[] = []) {
  return PendingMarkerExtension.configure({ terms })
}
