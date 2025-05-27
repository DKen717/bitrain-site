import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import ReportFilters from '../components/ReportFilters'
import ReportTable from '../components/ReportTable'
import Pagination from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'

export default function Home() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    selectedTimes: [],
    selectedWagons: [],
    workingStatus: ''
  })

  const [page, setPage] = useState(1)
  const pageSize = 100

  useEffect(() => {
  fetchData()
}, [page])

  
  const { data, total, loading, fetchData } = useReportData(filters, page, pageSize)

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
      workingStatus: ''
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
