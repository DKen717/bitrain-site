// pages/dashboard.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Button, Stack
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'
import dynamic from 'next/dynamic'

// ✔️ Импортируем компоненты Recharts по одному (без namespace)
const BarChart      = dynamic(() => import('recharts').then(m => m.BarChart),      { ssr: false })
const Bar           = dynamic(() => import('recharts').then(m => m.Bar),           { ssr: false })
const XAxis         = dynamic(() => import('recharts').then(m => m.XAxis),         { ssr: false })
const YAxis         = dynamic(() => import('recharts').then(m => m.YAxis),         { ssr: false })
const Tooltip       = dynamic(() => import('recharts').then(m => m.Tooltip),       { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Cell          = dynamic(() => import('recharts').then(m => m.Cell),          { ssr: false })

const BAR_DEFAULT = '#2196f3'
const BAR_SELECTED = '#ff9800'
const CHART_HEIGHT = 320

// ширина контейнера через ResizeObserver
function useContainerWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect?.width || 0
        if (w) setWidth(w)
      }
    })
    ro.observe(el)
    const onResize = () => {
      const w = el.getBoundingClientRect().width
      if (w) setWidth(w)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [])
  return [ref, width]
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [allRowsForDate, setAllRowsForDate] = useState([])
  const [availableTimes, setAvailableTimes] = useState([]) // ['HH:mm:ss']
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  const [selectedTenant, setSelectedTenant] = useState('ALL')

  const loadRowsForDate = useCallback(async () => {
    setLoading(true); setErrorText('')
    try {
      const d = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily')
        .select(`
          nomer_vagona,
          rabochij_nerabochij,
          arendator,
          naimenovanie_operacii,
          stanciya_operacii,
          dney_bez_operacii,
          vremya_otcheta
        `)
        .eq('data_otcheta', d)
        .not('vremya_otcheta', 'is', null)

      if (error) throw error

      const rows = data || []
      const timesSet = new Set(
        rows.map(r => String(r.vremya_otcheta))
            .filter(Boolean)
            .map(s => (s.length === 5 ? `${s}:00` : s))
      )
      const times = Array.from(timesSet).sort((a, b) => a.localeCompare(b))
      const latest = times.at(-1) || ''

      setAllRowsForDate(rows)
      setAvailableTimes(times)
      setSelectedTime(latest)

      console.log('[DASH] date=', d, 'rows=', rows.length, 'times=', times, 'latest=', latest)
    } catch (e) {
      setErrorText(e.message || 'Ошибка загрузки')
      setAllRowsForDate([])
      setAvailableTimes([])
      setSelectedTime('')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { loadRowsForDate() }, [loadRowsForDate])

  // локальная фильтрация по времени
  const rows = useMemo(() => {
    if (!selectedTime) return []
    const norm = (s) => (String(s).length === 5 ? `${s}:00` : String(s))
    const filtered = allRowsForDate.filter(r => norm(r.vremya_otcheta) === selectedTime)
    console.log('[DASH] selectedTime=', selectedTime, 'filtered rows=', filtered.length)
    return filtered
  }, [allRowsForDate, selectedTime])

  // агрегаты
  const byTenant = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const key = r.arendator || 'Без арендатора'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])

  const rowsFiltered = useMemo(() => {
    if (selectedTenant === 'ALL') return rows
    return rows.filter(r => (r.arendator || 'Без арендатора') === selectedTenant)
  }, [rows, selectedTenant])

  const statusSummary = useMemo(() => {
    const working = rowsFiltered.filter(r => r.rabochij_nerabochij === 'Рабочий').length
    const notWorking = rowsFiltered.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
    return { working, notWorking, total: rowsFiltered.length }
  }, [rowsFiltered])

  const top10ByOperation = useMemo(() => {
    const map = new Map()
    rowsFiltered.forEach(r => {
      const k = r.naimenovanie_operacii || 'Без операции'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rowsFiltered])

  const top10ByStation = useMemo(() => {
    const map = new Map()
    rowsFiltered.forEach(r => {
      const k = r.stanciya_operacii || 'Без станции'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rowsFiltered])

  console.log('[DASH] byTenant=', byTenant.length, 'topOps=', top10ByOperation.length, 'topStations=', top10ByStation.length)

  const [tenantRef, tenantWidth]     = useContainerWidth()
  const [opsRef, opsWidth]           = useContainerWidth()
  const [stationsRef, stationsWidth] = useContainerWidth()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дэшборд</Typography>

      {/* Дата и время */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Дата отчета"
              value={selectedDate}
              onChange={(v) => setSelectedDate(v)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="report-time-label">Время отчета</InputLabel>
            <Select
              labelId="report-time-label"
              id="report-time"
              value={selectedTime}
              label="Время отчета"
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {availableTimes.map((t, i) => (
                <MenuItem key={i} value={t}>{t.slice(0,5)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {errorText && <Typography color="error" sx={{ mb: 2 }}>{errorText}</Typography>}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} /> <Typography>Загрузка…</Typography>
        </Box>
      )}

      {/* KPI */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2">Всего вагонов</Typography>
            <Typography variant="h4">{statusSummary.total}</Typography>
            {selectedTenant !== 'ALL' && (
              <Typography variant="caption">Фильтр по: {selectedTenant}</Typography>
            )}
          </CardContent>
        </Card>

                // 1) Сразу под KPI-блоком добавь тестовый график
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Test chart</Typography>
            <div style={{ width: 900 }}>
              <BarChart width={900} height={220} data={[
                { name: 'A', count: 12 }, { name: 'B', count: 7 }, { name: 'C', count: 19 }
              ]} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} domain={[0, 'dataMax']} />
                <Tooltip />
                <Bar dataKey="count" barSize={28} />
              </BarChart>
            </div>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2">Рабочие</Typography>
            <Typography variant="h4">{statusSummary.working}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2">Нерабочие</Typography>
            <Typography variant="h4">{statusSummary.notWorking}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Вагоны по арендаторам */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6">Вагоны по арендаторам</Typography>
            <Button size="small" onClick={() => setSelectedTenant('ALL')} disabled={selectedTenant === 'ALL'}>
              Сбросить фильтр
            </Button>
          </Stack>


          // 2) В твоём графике "Вагоны по арендаторам" — добавь domain и barSize
<BarChart
  width={tenantWidth}
  height={CHART_HEIGHT}
  data={byTenant}
  margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
  key={`tenants-${selectedTime}-${byTenant.length}-${tenantWidth}`}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
  <YAxis allowDecimals={false} domain={[0, 'dataMax']} />
  <Tooltip />
  <Bar dataKey="count" barSize={28} isAnimationActive={false}>
    {byTenant.map((t, i) => (
      <Cell
        key={i}
        cursor="pointer"
        onClick={() => setSelectedTenant(t.name)}
        fill={selectedTenant !== 'ALL' && t.name === selectedTenant ? '#ff9800' : '#2196f3'}
      />
    ))}
  </Bar>
</BarChart>

          <Box ref={tenantRef} sx={{ width: '100%', minWidth: 320 }}>
            {tenantWidth > 0 && (
              <BarChart
                width={tenantWidth}
                height={CHART_HEIGHT}
                data={byTenant}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                key={`tenants-${selectedTime}-${byTenant.length}-${tenantWidth}`}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" isAnimationActive={false}>
                  {byTenant.map((t, i) => (
                    <Cell
                      key={i}
                      cursor="pointer"
                      onClick={() => setSelectedTenant(t.name)}
                      fill={selectedTenant !== 'ALL' && t.name === selectedTenant ? BAR_SELECTED : BAR_DEFAULT}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {`Позиции: ${byTenant.length} | container: ${tenantWidth}px`}
          </Typography>
        </CardContent>
      </Card>

      {/* ТОП-10 по операциям и станциям */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по операциям</Typography>
              <Box ref={opsRef} sx={{ width: '100%', minWidth: 320 }}>
                {opsWidth > 0 && (
                  <BarChart
                    width={opsWidth}
                    height={CHART_HEIGHT}
                    data={top10ByOperation}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    key={`ops-${selectedTime}-${top10ByOperation.length}-${opsWidth}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" isAnimationActive={false} />
                  </BarChart>
                )}
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {`Позиции: ${top10ByOperation.length} | container: ${opsWidth}px`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по станциям операций</Typography>
              <Box ref={stationsRef} sx={{ width: '100%', minWidth: 320 }}>
                {stationsWidth > 0 && (
                  <BarChart
                    width={stationsWidth}
                    height={CHART_HEIGHT}
                    data={top10ByStation}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    key={`stations-${selectedTime}-${top10ByStation.length}-${stationsWidth}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" isAnimationActive={false} />
                  </BarChart>
                )}
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {`Позиции: ${top10ByStation.length} | container: ${stationsWidth}px`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
