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
          "Рабочий/нерабочий",
          "Дней без операции",
          "Арендатор",
          "Простой на станции" as dwell_days  -- 👈 добавили алиас
        `, { count: 'exact' })

      // сортировка
      query = query
        .order('Дата отчета', { ascending: false })
        .order('Время отчета', { ascending: false })

      if (filters.fromDate) query = query.gte('Дата отчета', filters.fromDate)
      if (filters.toDate)   query = query.lte('Дата отчета', filters.toDate)

      if (filters.selectedTimes?.length > 0) {
        const formatted = filters.selectedTimes.map(t => `${t}:00`)
        query = query.in('Время отчета', formatted)
      }

      if (filters.selectedWagons?.length > 0) {
        query = query.in('Номер вагона', filters.selectedWagons)
      }

      if (filters.workingStatus) {
        query = query.eq('Рабочий/нерабочий', filters.workingStatus)
      }

      if (filters.minIdleDays) query = query.gte('Дней без операции', Number(filters.minIdleDays))
      if (filters.maxIdleDays) query = query.lte('Дней без операции', Number(filters.maxIdleDays))

      if (filters.selectedTenants?.length > 0) {
        query = query.in('Арендатор', filters.selectedTenants)
      }

      if (filters.selectedOperationStations?.length > 0) {
        query = query.in('Станция операции', filters.selectedOperationStations)
      }

      if (filters.selectedDepartureStations?.length > 0) {
        query = query.in('Станция отправления', filters.selectedDepartureStations)
      }

      if (filters.selectedDestinationStations?.length > 0) {
        query = query.in('Станция назначения', filters.selectedDestinationStations)
      }

      if (filters.loadStatus) {
        query = query.eq('Порожний/груженный', filters.loadStatus)
      }

      // (необязательно) фильтр по простою на станции
      if (filters.minDwellDays !== '' && filters.minDwellDays != null) {
        query = query.gte('Простой на станции', Number(filters.minDwellDays))
      }
      if (filters.maxDwellDays !== '' && filters.maxDwellDays != null) {
        query = query.lte('Простой на станции', Number(filters.maxDwellDays))
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
