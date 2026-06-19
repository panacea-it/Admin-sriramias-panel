import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useInitialRouteSearch(setSearch) {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const query = searchParams.get('search')?.trim()
    if (query) setSearch(query)
  }, [searchParams, setSearch])
}

export function useInitialRouteFilterSearch(setFilters) {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const query = searchParams.get('search')?.trim()
    if (query) setFilters((prev) => ({ ...prev, search: query }))
  }, [searchParams, setFilters])
}
