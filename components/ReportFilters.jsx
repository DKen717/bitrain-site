import { useEffect, useState } from 'react'
import {
  Box, MenuItem, InputLabel, FormControl, Select, OutlinedInput,
  Chip, TextField, Button
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function ReportFilters({ filters, setFilters, onSearch, onClear, loading, data }) {
  const [reportTimes, setReportTimes] = useState([])
  const [wagonNumbers, setWagonNumbers] = useState([])
  const [tenantOptions, setTenantOptions] = useState([])
  const [operationStations, setOperationStations] = useState([])
  const [departureStations, setDepartureStations] = useState([])
  const [destinationStations, setDestinationStations] = useState([])

  useEffect(() => {
    loadFilterOptions()
  }, [filters.fromDate, filters.toDate])

  const loadFilterOptions = async () => {
    const params = {
      from_date: filters.fromDate,
      to_date: filters.toDate
    }

    try {
      // 🔹 RPC берут уникальные значения
      const { data: timesRaw,  error: timeErr  } = await supabase.rpc('get_unique_times', params)
      const { data: wagonsRaw, error: wagonErr } = await supabase.rpc('get_unique_wagons', params)
      const { data: tenantsRaw, error: tenantErr } = await supabase.rpc('get_unique_tenants', params)
      const { data: opsRaw,    error: opsErr   } = await supabase.rpc('get_unique_operation_stations', params)
      const { data: depRaw,    error: depErr   } = await supabase.rpc('get_unique_departure_stations', params)
      const { data: destRaw,   error: destErr  } = await supabase.rpc('get_unique_destination_stations', params)

      if (timeErr || wagonErr || tenantErr || opsErr || depErr || destErr) {
        console.error('❌ Ошибка загрузки фильтров:', timeErr || wagonErr || tenantErr || opsErr || depErr || destErr)
        return
      }

      // ⏱ привожу к HH:mm для UI
      const times = (timesRaw || [])
        .map(row => {
          const t = row?.vremya_otcheta
          // t может быть 'HH:mm:ss' или 'HH:mm'
          if (!t) return null
          const s = String(t)
          return s.length >= 5 ? s.slice(0, 5) : s
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))

      // 🚃 вагонные номера → строки
      const wagons = (wagonsRaw || [])
        .map(row => row?.nomer_vagona?.toString())
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b))

      const tenants = Array.from(new Set(
        (tenantsRaw || []).map(row => row?.arendator?.toString()).filter(Boolean)
      )).sort()

      const opStations   = (opsRaw  || []).map(r => r?.stanciya_operacii).filter(Boolean).sort()
      const depStations  = (depRaw  || []).map(r => r?.stanciya_otpravleniya).filter(Boolean).sort()
      const destStations = (destRaw || []).map(r => r?.stanciya_naznacheniya).filter(Boolean).sort()

      setReportTimes(times)
      setWagonNumbers(wagons)
      setTenantOptions(tenants)
      setOperationStations(opStations)
      setDepartureStations(depStations)
      setDestinationStations(destStations)
    } catch (err) {
      console.error('❌ Ошибка выполнения loadFilterOptions:', err)
    }
  }

  const fetchAllDataForExport = async () => {
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
        prostoj_na_stancii,
        arendator
      `)

    if (filters.fromDate) query = query.gte('data_otcheta', filters.fromDate)
    if (filters.toDate)   query = query.lte('data_otcheta', filters.toDate)

    // В БД time обычно HH:mm:ss — добавим :00, если пришло HH:mm
    if (filters.selectedTimes?.length > 0) {
      const timesForDb = filters.selectedTimes.map(t => (t?.length === 5 ? `${t}:00` : t))
      query = query.in('vremya_otcheta', timesForDb)
    }

    // Вагон — bigint → приводим к числам
    if (filters.selectedWagons?.length > 0) {
      const wagonsForDb = filters.selectedWagons.map(w => Number(w)).filter(n => !Number.isNaN(n))
      if (wagonsForDb.length > 0) query = query.in('nomer_vagona', wagonsForDb)
    }

    if (filters.selectedTenants?.length > 0) query = query.in('arendator', filters.selectedTenants)
    if (filters.workingStatus)               query = query.eq('rabochij_nerabochij', filters.workingStatus)
    if (filters.loadStatus)                  query = query.eq('porozhnij_gruzhenyj', filters.loadStatus)

    // Числовые фильтры
    if (filters.minIdleDays !== '' && filters.minIdleDays != null) query = query.gte('dney_bez_operacii', Number(filters.minIdleDays))
    if (filters.maxIdleDays !== '' && filters.maxIdleDays != null) query = query.lte('dney_bez_operacii', Number(filters.maxIdleDays))
    if (filters.minDwellDays !== '' && filters.minDwellDays != null) query = query.gte('prostoj_na_stancii', Number(filters.minDwellDays))
    if (filters.maxDwellDays !== '' && filters.maxDwellDays != null) query = query.lte('prostoj_na_stancii', Number(filters.maxDwellDays))

    if (filters.selectedOperationStations?.length > 0)   query = query.in('stanciya_operacii', filters.selectedOperationStations)
    if (filters.selectedDepartureStations?.length > 0)   query = query.in('stanciya_otpravleniya', filters.selectedDepartureStations)
    if (filters.selectedDestinationStations?.length > 0) query = query.in('stanciya_naznacheniya', filters.selectedDestinationStations)

    const { data, error } = await query
    if (error) {
      console.error('❌ Ошибка при выгрузке всех данных:', error)
      return []
    }
    return data
  }

  const handleExport = async () => {
    const fullData = await fetchAllDataForExport()
    if (!fullData || fullData.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(fullData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, `Отчет_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
      <TextField label="Дата от" type="date" value={filters.fromDate}
        onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
        InputLabelProps={{ shrink: true }} size="small" sx={{ minWidth: 160 }} />

      <TextField label="Дата до" type="date" value={filters.toDate}
        onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
        InputLabelProps={{ shrink: true }} size="small" sx={{ minWidth: 160 }} />

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Время отчета</InputLabel>
        <Select multiple value={filters.selectedTimes}
          onChange={(e) => setFilters(prev => ({ ...prev, selectedTimes: e.target.value }))}
          input={<OutlinedInput label="Время отчета" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (<Chip key={value} label={value} />))}
            </Box>)}>
          {reportTimes.map((time) => (
            <MenuItem key={time} value={time}>{time}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Рабочий/нерабочий</InputLabel>
        <Select value={filters.workingStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, workingStatus: e.target.value }))}
          input={<OutlinedInput label="Рабочий/нерабочий" />}>
          <MenuItem value="">Все</MenuItem>
          <MenuItem value="Рабочий">Рабочий</MenuItem>
          <MenuItem value="Нерабочий">Нерабочий</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Порожний/груженный</InputLabel>
        <Select value={filters.loadStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, loadStatus: e.target.value }))}
          input={<OutlinedInput label="Порожний/груженный" />}>
          <MenuItem value="">Все</MenuItem>
          <MenuItem value="Порожний">Порожний</MenuItem>
          <MenuItem value="Груженный">Груженный</MenuItem>
        </Select>
      </FormControl>

      <Autocomplete multiple options={wagonNumbers} getOptionLabel={(opt) => opt.toString()}
        value={filters.selectedWagons}
        onChange={(event, newValue) => setFilters(prev => ({ ...prev, selectedWagons: newValue }))}
        filterSelectedOptions
        renderInput={(params) => (<TextField {...params} label="Номера вагонов" placeholder="Вводите номер" />)}
        size="small" sx={{ minWidth: 300 }} />

      <Autocomplete multiple options={tenantOptions}
        value={filters.selectedTenants}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, selectedTenants: newValue }))}
        filterSelectedOptions
        renderInput={(params) => (<TextField {...params} label="Арендатор" placeholder="Введите" size="small" />)}
        sx={{ minWidth: 250 }} />

      <Autocomplete multiple options={operationStations}
        value={filters.selectedOperationStations}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, selectedOperationStations: newValue }))}
        filterSelectedOptions
        renderInput={(params) => <TextField {...params} label="Станция операции" placeholder="Введите" size="small" />}
        sx={{ minWidth: 250 }}
      />

      <Autocomplete multiple options={departureStations}
        value={filters.selectedDepartureStations}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, selectedDepartureStations: newValue }))}
        filterSelectedOptions
        renderInput={(params) => <TextField {...params} label="Станция отправления" placeholder="Введите" size="small" />}
        sx={{ minWidth: 250 }}
      />

      <Autocomplete multiple options={destinationStations}
        value={filters.selectedDestinationStations}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, selectedDestinationStations: newValue }))}
        filterSelectedOptions
        renderInput={(params) => <TextField {...params} label="Станция назначения" placeholder="Введите" size="small" />}
        sx={{ minWidth: 250 }}
      />

      <TextField type="number" label="Дней без операции: от" value={filters.minIdleDays}
        onChange={(e) => setFilters(prev => ({ ...prev, minIdleDays: e.target.value }))}
        size="small" sx={{ fontSize: '0.55rem', minWidth: 160 }} />

      <TextField type="number" label="Дней без операции: до" value={filters.maxIdleDays}
        onChange={(e) => setFilters(prev => ({ ...prev, maxIdleDays: e.target.value }))}
        size="small" sx={{ fontSize: '0.55rem', minWidth: 160 }} />

      <TextField type="number" label="Простой на станции: от" value={filters.minDwellDays}
        onChange={(e) => setFilters(prev => ({ ...prev, minDwellDays: e.target.value }))}
        size="small" sx={{ minWidth: 160 }} />

      <TextField type="number" label="Простой на станции: до" value={filters.maxDwellDays}
        onChange={(e) => setFilters(prev => ({ ...prev, maxDwellDays: e.target.value }))}
        size="small" sx={{ minWidth: 160 }} />

      <Button onClick={onSearch} variant="contained" color="primary" disabled={loading}>
        {loading ? 'Загрузка...' : '🔍 Поиск'}
      </Button>

      <Button onClick={onClear} variant="outlined" color="secondary">
        🧹 Очистить
      </Button>

      <Button variant="outlined" onClick={handleExport} disabled={loading || data.length === 0}>
        📤 Экспорт в Excel
      </Button>
    </Box>
  )
}
