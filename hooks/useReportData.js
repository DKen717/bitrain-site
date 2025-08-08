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
        .from('Dislocation_daily')
        .select(`
          nomer_vagona,
          data_operacii,
          data_otcheta,
          vremya_otcheta,
          stanciya_operacii,
          stanciya_otpravleniya,
          stanciya_naznacheniya,
          naimenovanie_operacii,
          naimenovanie_gruza,
          tip_vagona,
          porozhnij_gruzhenyj,
          rabochij_nerabochij,
          dney_bez_operacii,
          arendator,
          prostoj_na_stancii
        `, { count: 'exact' })

      // сортировка
      query = query
        .order('data_otcheta', { ascending: false })
        .order('vremya_otcheta', { ascending: false })

      if (filters.fromDate) query = query.gte('data_otcheta', filters.fromDate)
      if (filters.toDate)   query = query.lte('data_otcheta', filters.toDate)

      if (filters.selectedTimes?.length > 0) {
        const formatted = filters.selectedTimes.map(t => `${t}:00`)
        query = query.in('vremya_otcheta', formatted)
      }

      if (filters.selectedWagons?.length > 0) {
        query = query.in('nomer_vagona', filters.selectedWagons)
      }

      if (filters.workingStatus) {
        query = query.eq('rabochij_nerabochij', filters.workingStatus)
      }

      if (filters.minIdleDays) query = query.gte('dney_bez_operacii', Number(filters.minIdleDays))
      if (filters.maxIdleDays) query = query.lte('dney_bez_operacii', Number(filters.maxIdleDays))

      if (filters.selectedTenants?.length > 0) {
        query = query.in('arendator', filters.selectedTenants)
      }

      if (filters.selectedOperationStations?.length > 0) {
        query = query.in('stanciya_operacii', filters.selectedOperationStations)
      }

      if (filters.selectedDepartureStations?.length > 0) {
        query = query.in('stanciya_otpravleniya', filters.selectedDepartureStations)
      }

      if (filters.selectedDestinationStations?.length > 0) {
        query = query.in('stanciya_naznacheniya', filters.selectedDestinationStations)
      }

      if (filters.loadStatus) {
        query = query.eq('porozhnij_gruzhenyj', filters.loadStatus)
      }

      if (filters.minDwellDays) query = query.gte('prostoj_na_stancii', Number(filters.minDwellDays))
      if (filters.maxDwellDays) query = query.lte('prostoj_na_stancii', Number(filters.maxDwellDays))

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
