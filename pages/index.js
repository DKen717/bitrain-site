import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [wagonNumbers, setWagonNumbers] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, wagonNumbers, page])

  async function fetchData() {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('Dislocation_daily2')
      .select('"Номер вагона", "Дата совершения операции", date_only', { count: 'exact' })
      .order('date_only', { ascending: false })
      .range(from, to)

    if (fromDate) query = query.gte('date_only', fromDate)
    if (toDate) query = query.lte('date_only', toDate)

    const numbers = wagonNumbers
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (numbers.length === 1) {
      query = query.eq('Номер вагона', numbers[0])
    } else if (numbers.length > 1) {
      query = query.in('Номер вагона', numbers)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Ошибка загрузки:', error.message)
    } else {
      setData(data)
    }
  }

  function clearFilters() {
    setFromDate('')
    setToDate('')
    setWagonNumbers('')
    setPage(1)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — отчёт по вагонам</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          📅 От:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPage(1)
              setFromDate(e.target.value)
            }}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label style={{ marginRight: '1rem' }}>
          До:
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPage(1)
              setToDate(e.target.value)
            }}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label>
          🚃 Номер вагона(ов):
          <input
            type="text"
            placeholder="через запятую"
            value={wagonNumbers}
            onChange={(e) => {
              setPage(1)
              setWagonNumbers(e.target.value)
            }}
            style={{ marginLeft: '0.5rem', width: '200px' }}
          />
        </label>

        <button onClick={clearFilters} style={{ marginLeft: '1rem' }}>🧹 Очистить фильтр</button>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>Дата (date_only)</th>
            <th>Номер вагона</th>
            <th>Дата операции</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>Нет данных</td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date_only}</td>
                <td>{row['Номер вагона']}</td>
                <td>{row['Дата совершения операции']}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          ⬅ Предыдущая
        </button>
        <span style={{ margin: '0 1rem' }}>Страница {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>
          Следующая ➡
        </button>
      </div>
    </div>
  )
}
