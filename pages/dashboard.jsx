// pages/dashboard.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box, Grid, Card, CardContent, Typography, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Divider
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dynamic from 'next/dynamic'
import AppLayout from '../components/AppLayout'
import { supabase } from '../src/supabaseClient'

// Recharts (без SSR)
const BarChart      = dynamic(() => import('recharts').then(m => m.BarChart),      { ssr: false })
const Bar           = dynamic(() => import('recharts').then(m => m.Bar),           { ssr: false })
const XAxis         = dynamic(() => import('recharts').then(m => m.XAxis),         { ssr: false })
const YAxis         = dynamic(() => import('recharts').then(m => m.YAxis),         { ssr: false })
const Tooltip       = dynamic(() => import('recharts').then(m => m.Tooltip),       { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

const CHART_HEIGHT = 320

// Рисуем столбики как <rect> (устойчиво к CSS-ресетам)
function BarRectShape({ x, y, width, height, fill }) {
  if (!width || !height || width <= 0 || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} fill={fill || 'hsl(var(--chart-primary))'} />
}

// Измеряем ширину контейнера (для Recharts)
function useContainerWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
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
    return () => { window.removeEventListener('resize', onResize); ro.disconnect() }
  }, [])
  return [ref, width]
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [latestTime, setLatestTime] = useState('') // HH:mm:ss
  const [counts, setCounts] = useState({ total: 0, working: 0, notWorking: 0 })
  const [rowsSlice, setRowsSlice] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  const [topNoOps, setTopNoOps] = useState([])
  const [topDwell, setTopDwell] = useState([])
  const [topLoading, setTopLoading] = useState(false)

  const [chartRef, chartWidth] = useContainerWidth()

  // 1) Последнее время за дату
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setErrorText('')
      setLatestTime('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('vremya_otcheta')
          .eq('data_otcheta', d)
          .not('vremya_otcheta', 'is', null)

        if (error) throw error

        const times = [...new Set((data || [])
          .map(r => String(r.vremya_otcheta))
          .filter(Boolean)
          .map(s => (s.length === 5 ? `${s}:00` : s)))]
          .sort((a, b) => a.localeCompare(b))

        if (!canceled) setLatestTime(times.at(-1) || '')
      } catch (e) {
        if (!canceled) setErrorText(e.message || 'Ошибка загрузки времени')
      }
    })()
    return () => { canceled = true }
  }, [selectedDate])

  // 2) KPI и массив для агрегации
  useEffect(() => {
    let canceled = false
    ;(async () => {
      if (!latestTime) { setCounts({ total: 0, working: 0, notWorking: 0 }); setRowsSlice([]); return }
      setLoading(true); setErrorText('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('rabochij_nerabochij, arendator')
          .eq('data_otcheta', d)
          .eq('vremya_otcheta', latestTime)

        if (error) throw error

        const rows = data || []
        const working = rows.filter(r => r.rabochij_nerabochij === 'Рабочий').length
        const notWorking = rows.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
        const total = rows.length

        if (!canceled) {
          setCounts({ total, working, notWorking })
          setRowsSlice(rows)
        }
      } catch (e) {
        if (!canceled) {
          setCounts({ total: 0, working: 0, notWorking: 0 })
          setRowsSlice([])
          setErrorText(e.message || 'Ошибка загрузки данных')
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [selectedDate, latestTime])

  // 3) Топ-10 списки через вьюхи (если нет — будут пустые)
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setTopLoading(true)
      try {
        // Топ вагонов без операций
        let noOps = []
        try {
          const { data, error } = await supabase
            .from('vw_top_no_ops')
            .select('*')
            .order('days_no_ops', { ascending: false })
            .limit(10)
          if (error) throw error
          noOps = (data || []).map(r => ({
            wagon: r.wagon ?? r.vagon ?? r.wagon_no ?? r.vagon_no ?? '',
            tenant: r.tenant ?? r.arendator ?? '',
            days: Number(r.days_no_ops ?? r.days ?? r.idle_days ?? 0)
          }))
        } catch {
          noOps = []
        }

        // Топ простоя на станции
        let dwell = []
        try {
          const { data, error } = await supabase
            .from('vw_top_station_dwell')
            .select('*')
            .order('dwell_days', { ascending: false })
            .limit(10)
          if (error) throw error
          dwell = (data || []).map(r => ({
            wagon: r.wagon ?? r.vagon ?? r.wagon_no ?? r.vagon_no ?? '',
            station: r.station ?? r.stantziya ?? r.stantciya ?? r.station_name ?? '',
            days: Number(r.dwell_days ?? r.days ?? r.idle_days ?? 0)
          }))
        } catch {
          dwell = []
        }

        if (!canceled) { setTopNoOps(noOps); setTopDwell(dwell) }
      } finally {
        if (!canceled) setTopLoading(false)
      }
    })()
    return () => { canceled = true }
  }, []) // грузим «топы» как текущее состояние; можно привязать к selectedDate, если представления поддерживают дату

  // 4) агрегируем по арендаторам (топ-15)
  const byTenant = useMemo(() => {
    const map = new Map()
    rowsSlice.forEach(r => {
      const k = r.arendator || 'Без арендатора'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [rowsSlice])

  const subtitle = useMemo(() => {
    const d = selectedDate.format('DD.MM.YYYY')
    const t = latestTime ? latestTime.slice(0,5) : '—'
    return `Срез на ${d} ${t}`
  }, [selectedDate, latestTime])

  return (
    <AppLayout collapsedDefault>
      <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>Дэшборд</Typography>
      <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>{subtitle}</Typography>

      {/* Дата */}
      <Box sx={{ maxWidth: 360, mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Дата отчёта"
            value={selectedDate}
            onChange={(v) => setSelectedDate(v)}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
        </LocalizationProvider>
      </Box>

      {errorText && <Alert severity="error" sx={{ mb: 2 }}>{errorText}</Alert>}

      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Всего вагонов</Typography>
            <Typography variant="h3">{loading ? '…' : counts.total}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Рабочие</Typography>
            <Typography variant="h3">{loading ? '…' : counts.working}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Нерабочие</Typography>
            <Typography variant="h3">{loading ? '…' : counts.notWorking}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Диаграмма: Вагоны по арендаторам */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Вагоны по арендаторам (топ-15)</Typography>
          <Box ref={chartRef} sx={{ width: '100%', minWidth: 320 }}>
            {chartWidth > 0 && byTenant.length > 0 ? (
              <BarChart
                width={chartWidth}
                height={CHART_HEIGHT}
                data={byTenant}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                key={`tenants-${latestTime}-${byTenant.length}-${chartWidth}`}
              >
                <CartesianGrid stroke="hsl(var(--table-border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, 'dataMax']}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  barSize={28}
                  isAnimationActive={false}
                  shape={<BarRectShape fill="hsl(var(--chart-primary))" />}
                />
              </BarChart>
            ) : (
              <Typography color="text.secondary">Нет данных для отображения.</Typography>
            )}
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Позиции: {byTenant.length} · контейнер: {chartWidth}px
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Топ-10 без операций */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Топ-10 вагонов без операций</Typography>
                {topLoading && <CircularProgress size={18} />}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              {topNoOps.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Вагон</TableCell>
                      <TableCell>Арендатор</TableCell>
                      <TableCell align="right">Дней</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topNoOps.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.wagon || '—'}</TableCell>
                        <TableCell>{r.tenant || '—'}</TableCell>
                        <TableCell align="right">{r.days ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">Нет данных.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Топ-10 простоя на станции */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Топ-10 простоя на станции</Typography>
                {topLoading && <CircularProgress size={18} />}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              {topDwell.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Вагон</TableCell>
                      <TableCell>Станция</TableCell>
                      <TableCell align="right">Дней</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topDwell.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.wagon || '—'}</TableCell>
                        <TableCell>{r.station || '—'}</TableCell>
                        <TableCell align="right">{r.days ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">Нет данных.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  )
}
