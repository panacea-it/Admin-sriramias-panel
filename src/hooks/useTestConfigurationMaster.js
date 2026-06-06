import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TEST_CONFIG_UPDATED_EVENT,
  fetchExamPatterns,
  fetchLanguages,
  fetchSectionConfigs,
} from '../api/testConfigurationAPI'

function truncateText(value, max = 72) {
  const text = String(value || '').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

/**
 * Centralized master configuration for Test Configuration → Prelims Test integration.
 * Loads active languages, sections, and exam instructions from master data.
 */
export function useTestConfigurationMaster({ activeOnly = true } = {}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [languages, setLanguages] = useState([])
  const [sections, setSections] = useState([])
  const [instructions, setInstructions] = useState([])
  const reloadInFlightRef = useRef(false)

  const reload = useCallback(async () => {
    if (reloadInFlightRef.current) return
    reloadInFlightRef.current = true
    setLoading(true)
    setError(null)
    const statusFilter = activeOnly ? { status: 'Active' } : {}
    try {
      const [langRows, sectionRows, instructionRows] = await Promise.all([
        fetchLanguages({ ...statusFilter, sortBy: 'languageName', sortDir: 'asc' }),
        fetchSectionConfigs({ ...statusFilter, sortBy: 'sectionName', sortDir: 'asc' }),
        fetchExamPatterns({ ...statusFilter, sortBy: 'createdOn', sortDir: 'desc' }),
      ])
      setLanguages(Array.isArray(langRows) ? langRows : [])
      setSections(Array.isArray(sectionRows) ? sectionRows : [])
      setInstructions(Array.isArray(instructionRows) ? instructionRows : [])
    } catch (err) {
      setError(err?.message || 'Failed to load test configuration')
      setLanguages([])
      setSections([])
      setInstructions([])
    } finally {
      setLoading(false)
      reloadInFlightRef.current = false
    }
  }, [activeOnly])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const onUpdate = () => reload()
    window.addEventListener(TEST_CONFIG_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener(TEST_CONFIG_UPDATED_EVENT, onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [reload])

  const languageOptions = useMemo(
    () => languages.map((row) => row.languageName).filter(Boolean),
    [languages],
  )

  const sectionOptions = useMemo(
    () =>
      sections
        .map((row) => ({ id: String(row.id), name: String(row.sectionName || '').trim() }))
        .filter((row) => row.id && row.name),
    [sections],
  )

  const instructionOptions = useMemo(
    () =>
      instructions
        .map((row) => ({
          id: String(row.id),
          description: String(row.instructionDescription || '').trim(),
          label: truncateText(row.instructionDescription),
        }))
        .filter((row) => row.id && row.description),
    [instructions],
  )

  const languageNameSet = useMemo(() => new Set(languageOptions), [languageOptions])

  const sectionById = useMemo(
    () => Object.fromEntries(sectionOptions.map((row) => [row.id, row])),
    [sectionOptions],
  )

  const instructionById = useMemo(
    () => Object.fromEntries(instructionOptions.map((row) => [row.id, row])),
    [instructionOptions],
  )

  return {
    loading,
    error,
    languages,
    sections,
    instructions,
    languageOptions,
    sectionOptions,
    instructionOptions,
    languageNameSet,
    sectionById,
    instructionById,
    reload,
  }
}

export default useTestConfigurationMaster
