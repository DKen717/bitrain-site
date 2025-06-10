import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import ReportFilters from '../components/ReportFilters'
import ReportTable from '../components/ReportTable'
import Pagination from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'
import TopNav from '../components/TopNav'


export default function Home() {
  const today = new Date().toISOString().slice(0, 10)

  const [filters, setFilters] = useState({
    fromDate: today,
    toDate: today,
    selectedTimes: [],
    selectedWagons: [],
    selectedTenants: [],
    workingStatus: '',
    minIdleDays: '',
    maxIdleDays: '',
    selectedOperationStations: [],
    selectedDepartureStations: [],
    selectedDestinationStations: [],
    loadStatus: ''
  })

  const [page, setPage] = useState(1)
  const pageSize = 100

  const { data, total, loading, fetchData } = useReportData(filters, page, pageSize)

  useEffect(() => {
    console.log('🧪 Фильтр по статусу:', filters.workingStatus)
    fetchData()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleClear = () => {
    setFilters({
      fromDate: today,
      toDate: today,
      selectedTimes: [],
      selectedWagons: [],
      selectedTenants: [],
      workingStatus: '',
      minIdleDays: '',
      maxIdleDays: '',
      selectedOperationStations: [],
      selectedDepartureStations: [],
      selectedDestinationStations: [],
      loadStatus: ''
    })
    setPage(1)
    fetchData()
  }



  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem', fontFamily: 'Arial', fontSize: '0.65rem' }}>
        <Typography variant="h4" gutterBottom>Aiway Logistic — отчет</Typography>

        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
          data={data}
        />

        {total !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginY: '1rem' }}>
            <strong>🔎 Найдено строк: {total}</strong>
          </Box>
        )}

        <ReportTable data={data} loading={loading} page={page} pageSize={pageSize} />
        <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
      </Box>
    </>
  )
}
