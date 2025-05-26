import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

import {
  Box, MenuItem, InputLabel, FormControl, Select, OutlinedInput,
  Chip, TextField, Button
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportTimes, setReportTimes] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [wagonNumbers, setWagonNumbers] = useState([])
  const [selectedWagons, setSelectedWagons] = useState([])
  const [workingStatus, setWorkingStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)

  const pageSize = 50

  useEffect(() => {
    loadOptions()
  }, [])

  async function loadOptions() {
    try {
      const { data: timesRaw, error: errTimes } = await supabase
        .from('Dislocation_daily2')
        .select('Время отчета', { distinct: true })
        .not('Время отчета', 'is', null)

      const { data: wagonsRaw, error: errWagons } = await supabase
        .from('Dislocation_daily2')
        .select('Номер вагона', { distinct: true })
        .not('Номер вагона', 'is', null)

      if (errTimes || errWagons) {
        console.error('Ошибка загрузки фильтров:', errTimes || errWagons)
        return
      }

      const times = timesRaw.map(row => {
        const t = row['Время отчета']
        if (!t) return null
        if (typeof t === 'string') return t.slice(0, 5)
        if (t instanceof Date) return t.toTimeString().slice(0, 5)
        return null
      }).filter(Boolean)

      const wagons = wagonsRaw
        .map(row => row['Номер вагона']?.toString())
        .filter(Boolean)

      setReportTimes(Array.from(new Set(times)))
      setWagonNumbers(Array.from(new Set(wagons)))
    } catch (err) {
      console.error('Ошибка выполнения loadOptions:', err)
    }
  }

  function buildQuery() {
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

    if (fromDate) query = query.gte('Дата отчета', fromDate)
    if (toDate) query = query.lte('Дата отчета', toDate)
    if (selectedTimes.length > 0) {
      const formattedTimes = selectedTimes.map(t => `${t}:00`)
      query = query.in('Время отчета', formattedTimes)
    }
    if (selectedWagons.length > 0) {
      query = query.in('Номер вагона', selectedWagons)
    }
    if (workingStatus) {
      query = query.eq('Рабочий/нерабочий', workingStatus)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    return query.range(from, to)
  }

  async function fetchData() {
    setLoading(true)
    try {
      const query = buildQuery()
      const { data, count, error } = await query

      if (error) {
        console.error('Ошибка загрузки:', error)
        setData([])
        setTotal(null)
      } else {
        setData(data)
        setTotal(count)
      }
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setSelectedTimes([])
    setSelectedWagons([])
    setWorkingStatus('')
    setPage(1)
    setData([])
    setTotal(null)
  }

  return (
    <Box sx={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Aiway Logistic — отчет</h1>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <TextField label="Дата от" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
        <TextField label="Дата до" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Время отчета</InputLabel>
          <Select multiple value={selectedTimes} onChange={(e) => setSelectedTimes(e.target.value)} input={<OutlinedInput label="Время отчета" />}
            renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} />)}</Box>)}>
            {reportTimes.map((time) => (<MenuItem key={time} value={time}>{time}</MenuItem>))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Рабочий/нерабочий</InputLabel>
          <Select value={workingStatus} onChange={(e) => setWorkingStatus(e.target.value)} input={<OutlinedInput label="Рабочий/нерабочий" />}>
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="Рабочий">Рабочий</MenuItem>
            <MenuItem value="Нерабочий">Нерабочий</MenuItem>
          </Select>
        </FormControl>

        <Autocomplete multiple options={wagonNumbers} getOptionLabel={(opt) => opt.toString()} value={selectedWagons}
          onChange={(event, newValue) => { setSelectedWagons(newValue); setPage(1) }}
          filterSelectedOptions renderInput={(params) => (<TextField {...params} label="Номера вагонов" placeholder="Вводите номер" />)}
          sx={{ minWidth: 300 }} />

        <Button onClick={() => { setPage(1); fetchData() }} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Загрузка...' : '🔍 Поиск'}
        </Button>
        <Button onClick={clearFilters} variant="outlined" color="secondary">🧹 Очистить</Button>
      </Box>

      {total !== null && (
        <Box sx={{ marginBottom: '1rem' }}>
          <strong>🔎 Найдено строк: {total}</strong>
        </Box>
      )}

      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>#</th>
            <th>Дата отчета</th>
            <th>Время</th>
            <th>Номер вагона</th>
            <th>Дата операции</th>
            <th>Операция</th>
            <th>Станция операции</th>
            <th>Станция отправления</th>
            <th>Станция назначения</th>
            <th>Наименование груза</th>
            <th>Тип вагона</th>
            <th>Порожний/груженный</th>
            <th>Рабочий/нерабочий</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="13" style={{ textAlign: 'center' }}>Нет данных</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{row['Дата отчета'] ? dayjs(row['Дата отчета']).format('DD.MM.YYYY') : ''}</td>
                <td>{row['Время отчета']}</td>
                <td>{row['Номер вагона']}</td>
                <td>{row['Дата совершения операции']}</td>
                <td>{row['Наименование операции']}</td>
                <td>{row['Станция операции']}</td>
                <td>{row['Станция отправления']}</td>
                <td>{row['Станция назначения']}</td>
                <td>{row['Наименование груза']}</td>
                <td>{row['Тип вагона']}</td>
                <td>{row['Порожний/груженный']}</td>
                <td>{row['Рабочий/нерабочий']}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {total !== null && (
        <Box sx={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>⬅ Пред.</button>
          <span style={{ margin: '0 1rem' }}>Страница {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page * pageSize) >= total}>След. ➡</button>
        </Box>
      )}
    </Box>
  )
}
