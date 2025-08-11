// pages/dashboard.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { Box, Grid, Card, CardContent, Typography } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'
import dynamic from 'next/dynamic'

// Recharts — по компонентам, без SSR
const BarChart      = dynamic(() => import('recharts').then(m => m.BarChart),      { ssr: false })
const Bar           = dynamic(() => import('recharts').then(m => m.Bar),           { ssr: false })
const XAxis         = dynamic(() => import('recharts').then(m => m.XAxis),         { ssr: false })
const YAxis         = dynamic(() => import('recharts').then(m => m.YAxis),         { ssr: false })
const Tooltip       = dynamic(() => import('recharts').then(m => m.Tooltip),       { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

const CHART_HEIGHT = 320

// --- рисуем столбики как <rect>, а не как <path> (устойчиво к CSS-ресетам) ---
function BarRectShape({ x, y, width, height, fill }) {
  if (!width || !height || width <= 0 || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} fill={fill || '#1976d2'} />
}

// --- ширина контейнера через ResizeObserver ---
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
    return () => { window.removeEventListener('resize', onResize); ro.disconnect() }
  }, [])
  return [ref, width]
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())      // дата отчёта
  const [latestTime, setLatestTime] = useState('')               // 'HH:mm:ss' за дату
  const [counts, setCounts] = useState({ total: 0, working: 0, notWorking: 0 })
  const [rowsSlice, setRowsSlice] = useState([])                 // строки среза для графика
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  const [chartRef, chartWidth] = useContainerWidth()

  // 1) Находим последнее время за выбранную дату
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

  // 2) Считаем KPI и забираем строки среза
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

  // 3) агрегируем по арендаторам (топ-15)
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дэшборд</Typography>
      <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>{subtitle}</Typography>

      {/* Дата */}
      <Box sx={{ maxWidth: 360, mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Дата отчета"
            value={selectedDate}
            onChange={(v) => setSelectedDate(v)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </Box>

      {errorText && <Typography color="error" sx={{ mb: 2 }}>{errorText}</Typography>}

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

      {/* Инфографика: Вагоны по арендаторам */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Вагоны по арендаторам (топ-15)</Typography>

          <Box ref={chartRef} sx={{ width: '100%', minWidth: 320 }}>
            {chartWidth > 0 && byTenant.length > 0 && (
              <BarChart
                width={chartWidth}
                height={CHART_HEIGHT}
                data={byTenant}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                key={`tenants-${latestTime}-${byTenant.length}-${chartWidth}`}
              >
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fill: '#424242', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, 'dataMax']}
                  tick={{ fill: '#424242', fontSize: 12 }}
                />
                <Tooltip />
                {/* ← Кастомная форма: рисуем <rect>, а не <path> */}
                <Bar
                  dataKey="count"
                  barSize={28}
                  isAnimationActive={false}
                  shape={<BarRectShape fill="#1976d2" />}
                />
              </BarChart>
            )}
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Позиции: {byTenant.length} | container: {chartWidth}px
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
