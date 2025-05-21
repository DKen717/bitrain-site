import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const today = new Date().toISOString().split('T')[0]

  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate])

  async function fetchData() {
    let query = supabase
      .from('Dislocation_daily2')
      .select('Номер вагона, Вес груза, date_only')
      .order('date_only', { ascending: false })

    if (fromDate) {
      query = query.gte('date_only', fromDate)
    }

    if (toDate) {
      query = query.lte('date_only', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setData(data)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — данные вагонов</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          📆 От:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        <label>
          До:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
      </div>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>Дата</th>
            <th>Номер вагона</th>
            <th>Вес груза</th>
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
                <td>{row['Вес груза']}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
