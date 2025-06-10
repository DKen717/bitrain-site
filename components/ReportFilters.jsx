import { useEffect, useState } from 'react'
import {
  Box, MenuItem, InputLabel, FormControl, Select, OutlinedInput,
  Chip, TextField, Button
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'

export default function ReportFilters({ filters, setFilters, onSearch, onClear, loading }) {
  const [reportTimes, setReportTimes] = useState([])
  const [wagonNumbers, setWagonNumbers] = useState([])
  const [tenantOptions, setTenantOptions] = useState([])
  const [operationStations, setOperationStations] = useState([])
  const [departureStations, setDepartureStations] = useState([])
  const [destinationStations, setDestinationStations] = useState([])


    useEffect(() => {
      loadFilterOptions()
    }, [filters.fromDate, filters.toDate]) // можно вызвать при изменении даты
    
    const loadFilterOptions = async () => {
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate
      }
    
      try {
        // 🔹 Время отчета
        const { data: timesRaw, error: timeErr } = await supabase.rpc('get_unique_times', params)
        
        // 🔹 Номера вагонов
        const { data: wagonsRaw, error: wagonErr } = await supabase.rpc('get_unique_wagons', params)
        
        // 🔹 Арендаторы
        const { data: tenantsRaw, error: tenantErr } = await supabase.rpc('get_unique_tenants', params)
        
        // 🔹 Станция операции
        const { data: opsRaw, error: opsErr } = await supabase.rpc('get_unique_operation_stations', params)
    
        // 🔹 Станция отправления
        const { data: depRaw, error: depErr } = await supabase.rpc('get_unique_departure_stations', params)
    
        // 🔹 Станция назначения
        const { data: destRaw, error: destErr } = await supabase.rpc('get_unique_destination_stations', params)
    
        if (timeErr || wagonErr || tenantErr || opsErr || depErr || destErr) {
          console.error('❌ Ошибка загрузки фильтров:', timeErr || wagonErr || tenantErr || opsErr || depErr || destErr)
          return
        }
    
        // 🧠 Лог сырого вывода
        console.log('📦 Время отчета (уникальные):', timesRaw)
        console.log('📦 Номера вагонов (уникальные):', wagonsRaw)
    
        // ⏱ Преобразование времени в HH:mm
        const times = (timesRaw || [])
          .map(row => {
            const t = row['Время отчета']
            return typeof t === 'string' ? t.slice(0, 5) : null
          })
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
    
        // 🚃 Преобразование вагонов в строку + сортировка
        const wagons = (wagonsRaw || [])
          .map(row => row['Номер вагона']?.toString())
          .filter(Boolean)
          .sort((a, b) => Number(a) - Number(b))
        
        const tenants = Array.from(new Set(
            tenantsRaw.map(row => row['Арендатор']?.toString()).filter(Boolean)
          )).sort()

        const opStations = opsRaw.map(r => r['Станция операции']).filter(Boolean).sort()
        const depStations = depRaw.map(r => r['Станция отправления']).filter(Boolean).sort()
        const destStations = destRaw.map(r => r['Станция назначения']).filter(Boolean).sort()
    
        // 🔍 Итог
        console.log('✅ Готовые времена:', times)
        console.log('✅ Готовые вагоны:', wagons)
    
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
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, selectedTenants: newValue })) }
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
        size="small" sx={{fontSize: '0.55rem', minWidth: 160 }} />
      
      <TextField type="number" label="Дней без операции: до" value={filters.maxIdleDays}
        onChange={(e) => setFilters(prev => ({ ...prev, maxIdleDays: e.target.value }))}
        size="small" sx={{fontSize: '0.55rem', minWidth: 160 }} />

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
