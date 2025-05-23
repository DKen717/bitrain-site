import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'
import {
  Box, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Chip
} from '@mui/material'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportTimes, setReportTimes] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [wagonNumbers, setWagonNumbers] = useState([])
  const [selectedWagons, setSelectedWagons] = useState([])

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, selectedTimes, selectedWagons, page])

  async function loadOptions() {
    const { data: timesRaw } = await supabase
      .from('Dislocation_daily2')
      .select('"Время отчета"')
      .neq('Время отчета', null)
  
    const { data: wagonsRaw } = await supabase
      .from('Dislocation_daily2')
      .select('"Номер вагона"')
      .neq('Номер вагона', null)
  
    const uniqueTimes = [...new Set(timesRaw.map(row => row['Время отчета']))]
    const uniqueWagons = [...new Set(wagonsRaw.map(row => row['Номер вагона']))]
  
    setReportTimes(uniqueTimes)
    setWagonNumbers(uniqueWagons)
  }


  async function fetchData() {
    let query = supabase
      .from('Dislocation_daily2')
      .select(`
        "Номер вагона",
        "Дата совершения операции",
        "Дата отчета",
        "Время отчета",
        "Станция операции",
        "Станция отправления",
        "Станция назначения"
      `, { count: 'exact' })
      .order('Дата отчета', { ascending: false })
      .order('Время отчета', { ascending: false })

    if (fromDate) query = query.gte('Дата отчета', fromDate)
    if (toDate) query = query.lte('Дата отчета', toDate)
    if (selectedTimes.length > 0) query = query.in('Время отчета', selectedTimes)
    if (selectedWagons.length > 0) query = query.in('Номер вагона', selectedWagons)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('❌ Ошибка загрузки:', error.message)
    } else {
      setData(data)
      setTotal(count || 0)
    }
  }

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setSelectedTimes([])
    setSelectedWagons([])
    setPage(1)
  }

  return (
    <Box sx={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Aiway Logistic — отчет</h1>

      <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <label>
          📅 От:
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          До:
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Время отчета</InputLabel>
          <Select
            multiple
            value={selectedTimes}
            onChange={(e) => setSelectedTimes(e.target.value)}
            input={<OutlinedInput label="Время отчета" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => <Chip key={value} label={value} />)}
              </Box>
            )}
          >
            {reportTimes.map((time) => (
              <MenuItem key={time} value={time}>
                {time}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Номера вагонов</InputLabel>
          <Select
            multiple
            value={selectedWagons}
            onChange={(e) => setSelectedWagons(e.target.value)}
            input={<OutlinedInput label="Номера вагонов" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => <Chip key={value} label={value} />)}
              </Box>
            )}
          >
            {wagonNumbers.map((wagon) => (
              <MenuItem key={wagon} value={wagon}>
                {wagon}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <button onClick={clearFilters}>🧹 Очистить</button>
      </Box>

      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>#</th>
            <th>Дата отчета</th>
            <th>Время</th>
            <th>Номер вагона</th>
            <th>Дата операции</th>
            <th>Станция операции</th>
            <th>Станция отправления</th>
            <th>Станция назначения</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Нет данных</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{row['Дата отчета']}</td>
                <td>{row['Время отчета']}</td>
                <td>{row['Номер вагона']}</td>
                <td>{row['Дата совершения операции']}</td>
                <td>{row['Станция операции']}</td>
                <td>{row['Станция отправления']}</td>
                <td>{row['Станция назначения']}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Box sx={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <p>Показано: {data.length} из {total} строк</p>
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>⬅ Пред.</button>
        <span style={{ margin: '0 1rem' }}>Страница {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={data.length < pageSize}>След. ➡</button>
      </Box>
    </Box>
  )
}
