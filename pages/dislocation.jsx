// pages/home.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import ReportFilters from '../components/ReportFilters'
import ReportTable from '../components/ReportTable'
import Pagination from '../components/Pagination'
import { useReportData } from '../hooks/useReportData'
import AppLayout from '../components/AppLayout' // ⬅️ добавили

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
    minDwellDays: '',
    maxDwellDays: '',
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
  }, [page]) // намеренно только при смене страницы; поиск дергает fetchData вручную

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
      minDwellDays: '',
      maxDwellDays: '',
      selectedOperationStations: [],
      selectedDepartureStations: [],
      selectedDestinationStations: [],
      loadStatus: ''
    })
    setPage(1)
    fetchData()
  }

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Дислокация
      </Typography>

      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={loading}
        data={data}
      />

      {total !== null && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
          <Typography variant="subtitle2">🔎 Найдено строк: {total}</Typography>
        </Box>
      )}

      <ReportTable data={data} loading={loading} page={page} pageSize={pageSize} />
      <Pagination page={page} setPage={setPage} total={total} pageSize={pageSize} />
    </AppLayout>
  )
}
