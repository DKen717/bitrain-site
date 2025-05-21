import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select('Номер вагона, Вес груза, date_only')
        .order('date_only', { ascending: false })
        .limit(20)

      if (error) console.error('Ошибка при загрузке:', error)
      else setData(data)
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Aiway Logistic — данные вагонов</h1>
      <table border="1" cellPadding="8" style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>Дата</th>
            <th>Номер вагона</th>
            <th>Вес груза</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>Загрузка данных...</td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr key={idx}>
              <td>{row.date_only}</td>
              <td>{row['Номер вагона']}</td>
              <td>{row['Вес груза']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
