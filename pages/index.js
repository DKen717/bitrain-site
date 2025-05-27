// pages/index.jsx
import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ReportFilters from '../components/ReportFilters'
import ReportTable from '../components/ReportTable'
import Pagination from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'

const pageSize = 50

export default function Home() {
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const { data, total, loading, fetchData } = useReportData(filters, page, pageSize)

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleClear = () => {
    setFilters({})
    setPage(1)
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Aiway Logistic — отчет</Typography>
      <ReportFilters filters={filters} setFilters={setFilters} onSearch={handleSearch} onClear={handleClear} loading={loading} />
      {total !== null && <Typography mt={2}>🔎 Найдено строк: {total}</Typography>}
      <ReportTable data={data} page={page} pageSize={pageSize} loading={loading} />
      <Pagination total={total} page={page} pageSize={pageSize} setPage={setPage} />
    </Box>
  )
}
