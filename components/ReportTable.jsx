import { Box, CircularProgress } from '@mui/material'
import dayjs from 'dayjs'

export default function ReportTable({ data, loading, page, pageSize }) {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Box>
    )
  }

  function copyColumn(colName) {
    const rows = data.map(row => row[colName] ?? '')
    const text = rows.join('\n')
    navigator.clipboard.writeText(text).then(() => {
      alert(`Скопирован столбец: ${colName}`)
    })
  }

  return (
    <>
      <Box sx={{ marginBottom: '1rem' }}>
        <button onClick={() => copyColumn('Номер вагона')}>📋 Копировать Номер вагона</button>
        <button onClick={() => copyColumn('Дата отчета')}>📋 Копировать Дата отчета</button>
        <button onClick={() => copyColumn('Станция операции')}>📋 Копировать Станция операции</button>
      </Box>

      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', userSelect: 'text' }}>
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
            <th>Дней без операции</th>
            <th>Арендатор</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="15" style={{ textAlign: 'center' }}>Нет данных</td></tr>
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
                <td>{row['Дней без операции']}</td>
                <td>{row['Арендатор']}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}
