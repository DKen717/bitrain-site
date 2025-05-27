import { useState, useEffect } from 'react'  // ✅ исправленный импорт
import { Box, Typography } from '@mui/material'
import ReportFilters from '../components/ReportFilters'
import ReportTable from '../components/ReportTable'
import Pagination from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'




export default function Home() {
const today = new Date().toISOString().slice(0, 10)  // формат YYYY-MM-DD

const [filters, setFilters] = useState({
  fromDate: today,
  toDate: today,
  selectedTimes: [],
  selectedWagons: [],
  workingStatus: '',
  minIdleDays: '',  // ➕ от
  maxIdleDays: ''   // ➕ до
})


  const [page, setPage] = useState(1)
  const pageSize = 100

  const { data, total, loading, fetchData } = useReportData(filters, page, pageSize)

  // ⬇️ теперь всё правильно — fetchData уже определён
  useEffect(() => {
    fetchData(console.log('🧪 Фильтр по статусу:', filters.workingStatus)
)
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleClear = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      selectedTimes: [],
      selectedWagons: [],
      workingStatus: '',
      minIdleDays: '',  // ➕ от
      maxIdleDays: ''   // ➕ до
    })
    setPage(1)
    fetchData()
  }

  return (
    <Box sx={{ padding: '2rem', fontFamily: 'Arial' }}>
      <Typography variant="h4" gutterBottom>Aiway Logistic — отчет</Typography>

      <ReportFilters filters={filters} setFilters={setFilters} onSearch={handleSearch} onClear={handleClear} loading={loading} />

      {total !== null && (
        <Box sx={{ marginY: '1rem' }}>
          <strong>🔎 Найдено строк: {total}</strong>
        </Box>
      )}

      <ReportTable data={data} loading={loading} page={page} pageSize={pageSize} />
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </Box>
  )
}
