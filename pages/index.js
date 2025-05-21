import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data, error } = await supabase
      .from('Dislocation_daily2')
      .select('"Номер вагона", "Дата совершения операции", date_only')
      .order('date_only', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Ошибка загрузки:', error.message)
    } else {
      console.log('✅ Данные получены:', data)
      setData(data)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — последние 5 записей</h1>

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
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
    </div>
  )
}
