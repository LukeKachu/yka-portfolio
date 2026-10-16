type DataError = {code?: string; message: string}
type ReadResult<T> = {data: T | null; error: DataError | null}

const networkCodes = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
  'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET',
])

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const code = 'code' in error ? String(error.code) : ''
  return networkCodes.has(code)
    || error.name === 'AbortError'
    || error.name === 'TimeoutError'
    || /fetch failed|network error|failed to fetch/i.test(error.message)
    || (error.cause instanceof Error && isNetworkFailure(error.cause))
}

// Supabase normally returns transport errors in `error`. A rejected request
// must behave identically, without swallowing programming or Next.js errors.
export async function readPublicResult<T>(read: () => PromiseLike<ReadResult<T>>): Promise<ReadResult<T>> {
  try {
    return await read()
  } catch (error) {
    if (!isNetworkFailure(error)) throw error
    return {data: null, error: {message: 'Public content network connection unavailable.'}}
  }
}
