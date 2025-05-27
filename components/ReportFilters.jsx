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

  useEffect(() => {
    loadFilterOptions()
  }, [])

      const loadFilterOptions = async () => {
  try {
    const { data: timesRaw, error: timeErr } = await supabase
      .from('Dislocation_daily2')
      .select('"Время отчета"')
      .not('Время отчета', 'is', null)
      .order('Время отчета', { ascending: true })
      .limit(10000)

    const { data: wagonsRaw, error: wagonErr } = await supabase
      .from('Dislocation_daily2')
      .select('"Номер вагона"')
      .not('Номер вагона', 'is', null)
      .order('Номер вагона', { ascending: true })
      .limit(10000)

    if (timeErr || wagonErr) {
      console.error('❌ Supabase ошибка:', timeErr || wagonErr)
      return
    }

    // 🔹 Уникальные ВРЕМЕНА отчета
    const times = Array.from(new Set(
      timesRaw
        .map(row => {
          const t = row['Время отчета']
          if (!t) return null
          if (typeof t === 'string') return t.slice(0, 5)
          if (t instanceof Date) return t.toTimeString().slice(0, 5)
          return null
        })
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b))

    // 🔹 Уникальные НОМЕРА вагонов
    const wagons = Array.from(new Set(
      wagonsRaw
        .map(row => row['Номер вагона']?.toString())
        .filter(Boolean)
    )).sort((a, b) => Number(a) - Number(b))

    // ✅ Сохраняем в состояние
    setReportTimes(times)
    setWagonNumbers(wagons)
  } catch (err) {
    console.error('❌ Ошибка в loadFilterOptions:', err)
  }
}

  console.log('✅ Уникальные ВРЕМЕНА:', times)
console.log('✅ Уникальные ВАГОНЫ:', wagons)




  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
      <TextField label="Дата от" type="date" value={filters.fromDate}
        onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
        InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />

      <TextField label="Дата до" type="date" value={filters.toDate}
        onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
        InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />

      <FormControl sx={{ minWidth: 200 }}>
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

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Рабочий/нерабочий</InputLabel>
        <Select value={filters.workingStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, workingStatus: e.target.value }))}
          input={<OutlinedInput label="Рабочий/нерабочий" />}>
          <MenuItem value="">Все</MenuItem>
          <MenuItem value="Рабочий">Рабочий</MenuItem>
          <MenuItem value="Нерабочий">Нерабочий</MenuItem>
        </Select>
      </FormControl>

      <Autocomplete multiple options={wagonNumbers} getOptionLabel={(opt) => opt.toString()}
        value={filters.selectedWagons}
        onChange={(event, newValue) => setFilters(prev => ({ ...prev, selectedWagons: newValue }))}
        filterSelectedOptions
        renderInput={(params) => (<TextField {...params} label="Номера вагонов" placeholder="Вводите номер" />)}
        sx={{ minWidth: 300 }} />

      <Button onClick={onSearch} variant="contained" color="primary" disabled={loading}>
        {loading ? 'Загрузка...' : '🔍 Поиск'}
      </Button>

      <Button onClick={onClear} variant="outlined" color="secondary">
        🧹 Очистить
      </Button>
    </Box>
  )
}
