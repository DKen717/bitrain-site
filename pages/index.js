import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedTimes, setSelectedTimes] = useState([])
  const [selectedWagons, setSelectedWagons] = useState([])
  const [availableTimes, setAvailableTimes] = useState([])
  const [availableWagons, setAvailableWagons] = useState([])
  const [page, setPage] = useState(1)
  const [trigger, setTrigger] = useState(0)
  const [total, setTotal] = useState(0)

  const pageSize = 20

  useEffect(() => {
    loadFilterValues()
  }, [])

  useEffect(() => {
    fetchData()
  }, [trigger, page])

  async function loadFilterValues() {
    const [{ data: times }, { data: wagons }] = await Promise.all([
      supabase.from('Dislocation_daily2').select('"Время отчета"').order('Время отчета', { ascending: false }),
      supabase.from('Dislocation_daily2').select('"Номер вагона"').order('Номер вагона', { ascending: true })
    ])

    const uniqueTimes = [...new Set(times.map(row => row['Время отчета']))]
    const uniqueWagons = [...new Set(wagons.map(row => row['Номер вагона']))]

    setAvailableTimes(uniqueTimes)
    setAvailableWagons(uniqueWagons)
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

  function triggerSearch() {
    setPage(1)
    setTrigger(prev => prev + 1)
  }

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setSelectedTimes([])
    setSelectedWagons([])
    setPage(1)
    setData([])
    setTotal(0)
    setTrigger(prev => prev + 1)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — отчёт по вагонам</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          📅 От:
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ marginLeft: '0.5rem' }} />
        </label>

        <label style={{ marginRight: '1rem' }}>
          До:
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ marginLeft: '0.5rem' }} />
        </label>

        <label style={{ marginRight: '1rem' }}>
          🕒 Время отчета:
          <select multiple value={selectedTimes} onChange={(e) => setSelectedTimes(Array.from(e.target.selectedOptions, o => o.value))}>
            {availableTimes.map((time, idx) => (
              <option key={idx} value={time}>{time}</option>
            ))}
          </select>
        </label>

        <label>
          🚃 Номера вагонов:
          <select multiple value={selectedWagons} onChange={(e) => setSelectedWagons(Array.from(e.target.selectedOptions, o => o.value))} style={{ width: '200px' }}>
            {availableWagons.map((wagon, idx) => (
              <option key={idx} value={wagon}>{wagon}</option>
            ))}
          </select>
        </label>

        <button onClick={triggerSearch} style={{ marginLeft: '1rem' }}>🔍 Найти</button>
        <button onClick={clearFilters} style={{ marginLeft: '0.5rem' }}>🧹 Очистить</button>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>№</th>
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

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
        <p>Показано: {data.length} строк из {total}</p>
        <div style={{ marginTop: '0.5rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>⬅ Предыдущая</button>
          <span style={{ margin: '0 1rem' }}>Страница {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={data.length < pageSize}>Следующая ➡</button>
        </div>
      </div>
    </div>
  )
}
