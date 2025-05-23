import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportTime, setReportTime] = useState('')
  const [wagonNumbers, setWagonNumbers] = useState('')
  const [page, setPage] = useState(1)
  const [trigger, setTrigger] = useState(0)
  const [total, setTotal] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const pageSize = 20

  useEffect(() => {
    fetchData()
  }, [trigger, page])

  async function fetchData() {
    let base = supabase
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

    // Первоначальная загрузка — только свежие данные
    if (isInitialLoad) {
      const { data: latest, error: err1 } = await supabase
        .from('Dislocation_daily2')
        .select('"Дата отчета", "Время отчета"')
        .order('Дата отчета', { ascending: false })
        .order('Время отчета', { ascending: false })
        .limit(1)

      if (latest && latest.length > 0) {
        const latestDate = latest[0]['Дата отчета']
        const latestTime = latest[0]['Время отчета']
        setFromDate(latestDate)
        setToDate(latestDate)
        setReportTime(latestTime)
        setIsInitialLoad(false)

        base = base
          .eq('Дата отчета', latestDate)
          .eq('Время отчета', latestTime)
      }
    } else {
      if (fromDate) base = base.gte('Дата отчета', fromDate)
      if (toDate) base = base.lte('Дата отчета', toDate)
      if (reportTime) base = base.eq('Время отчета', reportTime)

      const numbers = wagonNumbers
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)

      if (numbers.length === 1) {
        base = base.eq('Номер вагона', numbers[0])
      } else if (numbers.length > 1) {
        base = base.in('Номер вагона', numbers)
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    base = base.range(from, to)

    const { data, count, error } = await base

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
    setWagonNumbers('')
    setPage(1)
    setData([])
    setTotal(0)
    setTrigger((prev) => prev + 1)
  }

  function triggerSearch() {
    setIsInitialLoad(false)
    setPage(1)
    setTrigger((prev) => prev + 1)
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
            onChange={(e) => setFromDate(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label style={{ marginRight: '1rem' }}>
          До:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label style={{ marginRight: '1rem' }}>
          🕒 Время отчета:
          <input
            type="time"
            value={reportTime}
            onChange={(e) => setReportTime(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label>
          🚃 Номера вагонов:
          <input
            type="text"
            placeholder="напр: 9301, 9714"
            value={wagonNumbers}
            onChange={(e) => setWagonNumbers(e.target.value)}
            style={{ marginLeft: '0.5rem', width: '200px' }}
          />
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

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
        <p>Показано: {data.length} строк из {total}</p>
        <div style={{ marginTop: '0.5rem' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ⬅ Предыдущая
          </button>
          <span style={{ margin: '0 1rem' }}>Страница {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={data.length < pageSize}>
            Следующая ➡
          </button>
        </div>
      </div>
    </div>
  )
}
