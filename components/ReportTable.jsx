import { Box, CircularProgress, Button, Autocomplete, TextField } from '@mui/material'
import dayjs from 'dayjs'
import { useState } from 'react'

export default function ReportTable({ data, loading, page, pageSize }) {
  const [selectedColumns, setSelectedColumns] = useState([]) // [{label,key}, ...]

  // Справочник колонок: русская подпись + новый ключ в БД
  const columnDefs = [
    { label: 'Дата отчета',             key: 'data_otcheta' },
    { label: 'Время отчета',            key: 'vremya_otcheta' },
    { label: 'Номер вагона',            key: 'nomer_vagona' },
    { label: 'Дата совершения операции',key: 'data_operacii' },
    { label: 'Наименование операции',   key: 'naimenovanie_operacii' },
    { label: 'Станция операции',        key: 'stanciya_operacii' },
    { label: 'Станция отправления',     key: 'stanciya_otpravleniya' },
    { label: 'Станция назначения',      key: 'stanciya_naznacheniya' },
    { label: 'Наименование груза',      key: 'naimenovanie_gruza' },
    { label: 'Тип вагона',              key: 'tip_vagona' },
    { label: 'Порожний/груженный',      key: 'porozhnij_gruzhenyj' },
    { label: 'Рабочий/нерабочий',       key: 'rabochij_nerabochij' },
    { label: 'Дней без операции',       key: 'dney_bez_operacii' },
    { label: 'Простой на станции',      key: 'prostoj_na_stancii' },
    { label: 'Арендатор',               key: 'arendator' },
  ]

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Box>
    )
  }

  function copySelectedColumns() {
    if (!selectedColumns.length) return
    const header = selectedColumns.map(c => c.label).join('\t')
    const rows = data.map(row =>
      selectedColumns.map(c => {
        const val = row?.[c.key]
        if (c.key === 'data_otcheta' && val) {
          return dayjs(val).format('DD.MM.YYYY')
        }
        return val ?? ''
      }).join('\t')
    )
    const text = [header, ...rows].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      alert(`Скопированы выбранные столбцы:\n${selectedColumns.map(c => c.label).join(', ')}`)
    })
  }

  return (
    <>
      <Box sx={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Autocomplete
          multiple
          options={columnDefs}
          value={selectedColumns}
          onChange={(event, newValue) => setSelectedColumns(newValue)}
          getOptionLabel={(opt) => opt.label}
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
            {columnDefs.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columnDefs.length + 1} style={{ textAlign: 'center' }}>Нет данных</td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                {columnDefs.map((col, i) => {
                  const val = row?.[col.key]
                  return (
                    <td key={i}>
                      {col.key === 'data_otcheta' && val
                        ? dayjs(val).format('DD.MM.YYYY')
                        : (val ?? '')
                      }
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}
