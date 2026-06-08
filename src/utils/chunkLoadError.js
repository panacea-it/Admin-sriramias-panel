/** Detect Vite / browser failures when a code-split chunk cannot be fetched. */
export function isChunkLoadError(error) {
  const msg = error?.message ?? String(error ?? '')
  const isDynamicImportFailure =
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Failed to load module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')

  if (import.meta.env.DEV && isDynamicImportFailure) {
    // Syntax errors and missing modules surface the same message in dev — show real detail.
    if (
      msg.includes('Unexpected token') ||
      msg.includes('does not provide an export') ||
      msg.includes('Could not resolve') ||
      msg.includes('Failed to resolve import')
    ) {
      return false
    }
  }

  return (
    isDynamicImportFailure ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  )
}
