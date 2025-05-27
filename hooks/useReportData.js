import { useState, useCallback } from 'react'
import { supabase } from '../src/supabaseClient'

export function useReportData(filters, page, pageSize) {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('Dislocation_daily2')
        .select(`
          "Номер вагона",
          "Дата совершения операции",
          "Дата отчета",
          "Время отчета",
          "Станция операции",
          "Станция отправления",
          "Станция назначения",
          "Наименование операции",
          "Наименование груза",
          "Тип вагона",
          "Порожний/груженный",
          "Рабочий/нерабочий"
        `, { count: 'exact' })

      if (filters.fromDate) {
        query = query.gte('Дата отчета', filters.fromDate)
      }

      if (filters.toDate) {
        query = query.lte('Дата отчета', filters.toDate)
      }

      if (filters.selectedTimes.length > 0) {
        const formatted = filters.selectedTimes.map(t => `${t}:00`)
        query = query.in('Время отчета', formatted)
      }

      if (filters.selectedWagons.length > 0) {
        query = query.in('Номер вагона', filters.selectedWagons)
      }

      if (filters.workingStatus) {
        query = query.eq('Рабочий/нерабочий', filters.workingStatus)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) {
        console.error('Ошибка загрузки данных:', error)
        setData([])
        setTotal(null)
      } else {
        setData(data)
        setTotal(count)
      }
    } catch (err) {
      console.error('Ошибка запроса:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  return { data, total, loading, fetchData }
}
