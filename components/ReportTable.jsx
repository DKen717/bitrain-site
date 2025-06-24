import { Box, CircularProgress, Button, Autocomplete, TextField } from '@mui/material'
import dayjs from 'dayjs'
import { useState } from 'react'

export default function ReportTable({ data, loading, page, pageSize }) {
  const [selectedColumns, setSelectedColumns] = useState([])

  const allColumns = [
    'Дата отчета',
    'Время отчета',
    'Номер вагона',
    'Дата совершения операции',
    'Наименование операции',
    'Станция операции',
    'Станция отправления',
    'Станция назначения',
    'Наименование груза',
    'Тип вагона',
    'Порожний/груженный',
    'Рабочий/нерабочий',
    'Дней без операции',
    'Арендатор'
  ]

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Box>
    )
  }

  function copySelectedColumns() {
    if (selectedColumns.length === 0) return

    const rows = data.map(row => {
      return selectedColumns.map(col => row[col] ?? '').join('\t')
    })

    const text = [selectedColumns.join('\t'), ...rows].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      alert(`Скопированы выбранные столбцы:\n${selectedColumns.join(', ')}`)
    })
  }

  return (
    <>
      <Box sx={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Autocomplete
          multiple
          options={allColumns}
          value={selectedColumns}
          onChange={(event, newValue) => setSelectedColumns(newValue)}
          renderInput={(params) => <TextField {...params} label="Выберите столбцы" placeholder="Столбцы" />}
          sx={{ minWidth: 400 }}
        />
        <Button 
          variant="contained" 
          disabled={selectedColumns.length === 0} 
          onClick={copySelectedColumns}
        >
          📋 Копировать выбранные
        </Button>
      </Box>

      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', userSelect: 'text' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>#</th>
            {allColumns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={allColumns.length + 1} style={{ textAlign: 'center' }}>Нет данных</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                {allColumns.map((col, i) => (
                  <td key={i}>
                    {col === 'Дата отчета' && row[col] 
                      ? dayjs(row[col]).format('DD.MM.YYYY')
                      : row[col]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}
