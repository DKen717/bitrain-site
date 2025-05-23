import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportTime, setReportTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])
  const [allWagonNumbers, setAllWagonNumbers] = useState([])
  const [filteredWagonNumbers, setFilteredWagonNumbers] = useState([])

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, reportTime, filteredWagonNumbers, page])

  async function loadFilterOptions() {
    const { data: timeData } = await supabase
      .from('Dislocation_daily2')
      .select('Время отчета')
      .order('Время отчета', { ascending: true })

    const { data: wagonData } = await supabase
      .from('Dislocation_daily2')
      .select('Номер вагона')
      .order('Номер вагона', { ascending: true })

    const uniqueTimes = [...new Set((timeData || []).map((row) => row['Время отчета']))]
    const uniqueWagons = [...new Set((wagonData || []).map((row) => row['Номер вагона']))]

    setAvailableTimes(uniqueTimes)
    setAllWagonNumbers(uniqueWagons)
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
    if (reportTime) query = query.eq('Время отчета', reportTime)
    if (filteredWagonNumbers.length > 0) {
      query = query.in('Номер вагона', filteredWagonNumbers)
    }

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
    setReportTime('')
    setFilteredWagonNumbers([])
    setPage(1)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — отчет по вагонам</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          📅 От:
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label style={{ marginRight: '1rem' }}>
          До:
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <label style={{ marginRight: '1rem' }}>
          🕒 Время отчета:
          <select value={reportTime} onChange={(e) => setReportTime(e.target.value)}>
            <option value="">Все</option>
            {availableTimes.map((time, idx) => (
              <option key={idx} value={time}>{time}</option>
            ))}
          </select>
        </label>
        <button onClick={clearFilters} style={{ marginLeft: '1rem' }}>🧹 Очистить</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        🚃 Фильтр по номеру вагона:
        <input
          type="text"
          placeholder="фильтр по номерам"
          onChange={(e) => {
            const values = e.target.value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
            setFilteredWagonNumbers(values)
            setPage(1)
          }}
          style={{ marginLeft: '0.5rem', width: '250px' }}
        />
      </div>

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
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>Нет данных</td>
            </tr>
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

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <p>Показано: {data.length} строк из {total}</p>
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>⬅ Пред.</button>
        <span style={{ margin: '0 1rem' }}>Страница {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={data.length < pageSize}>След. ➡</button>
      </div>
    </div>
  )
}
