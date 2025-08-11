// pages/dashboard.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Box, Grid, Card, CardContent, Typography } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'
import dynamic from 'next/dynamic'

// recharts — по-компонентно, без SSR
const BarChart      = dynamic(() => import('recharts').then(m => m.BarChart),      { ssr: false })
const Bar           = dynamic(() => import('recharts').then(m => m.Bar),           { ssr: false })
const XAxis         = dynamic(() => import('recharts').then(m => m.XAxis),         { ssr: false })
const YAxis         = dynamic(() => import('recharts').then(m => m.YAxis),         { ssr: false })
const Tooltip       = dynamic(() => import('recharts').then(m => m.Tooltip),       { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

const CHART_HEIGHT = 320

// ширина контейнера через ResizeObserver (без ResponsiveContainer)
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
  const [rowsSlice, setRowsSlice] = useState([])                 // строки текущего среза (для графика)
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

  // 2) Считаем KPI и забираем строки среза для инфографики
  useEffect(() => {
    let canceled = false
    ;(async () => {
      if (!latestTime) { setCounts({ total: 0, working: 0, notWorking: 0 }); setRowsSlice([]); return }
      setLoading(true); setErrorText('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')

        // сразу берём всё, что нужно и для KPI, и для графика
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

  // 3) Данные для графика: кол-во вагонов по арендаторам (топ-15)
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
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Всего вагонов</Typography>
              <Typography variant="h3">{loading ? '…' : counts.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Рабочие</Typography>
              <Typography variant="h3">{loading ? '…' : counts.working}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Нерабочие</Typography>
              <Typography variant="h3">{loading ? '…' : counts.notWorking}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      // …выше — без изменений (KPI и прочее)

      // === Инфографика: Вагоны по арендаторам ===
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Вагоны по арендаторам (топ-15)</Typography>
      
          {/* 0) Диагностика: базовый SVG — должен быть виден как синий прямоугольник */}
          <Box sx={{ mb: 2 }}>
            <svg width="220" height="24" style={{ border: '1px solid #ccc' }}>
              <rect x="2" y="2" width="200" height="20" fill="#1976d2" />
            </svg>
            <Typography variant="caption" sx={{ ml: 1, opacity: .7 }}>
              SVG-тест: если прямоугольник виден — SVG не скрыт стилями
            </Typography>
          </Box>
      
          {/* 1) Табличка-резерв — чтобы точно видеть данные */}
          <Box sx={{ mb: 2, overflowX: 'auto' }}>
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
              <thead style={{ background: '#f5f5f5' }}>
                <tr><th>Арендатор</th><th>Кол-во вагонов</th></tr>
              </thead>
              <tbody>
                {byTenant.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center' }}>Нет данных</td></tr>
                ) : (
                  byTenant.map((r, i) => (
                    <tr key={i}><td>{r.name || 'Без арендатора'}</td><td>{r.count}</td></tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
      
          {/* 2) Контейнер под Recharts */}
          <Box ref={chartRef} sx={{ width: '100%', minWidth: 320 }}>
            {/* Диагностика: ширина и пример первой строки */}
            <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: .7 }}>
              debug: width={chartWidth}px; sample={byTenant[0] ? JSON.stringify(byTenant[0]) : '—'}
            </Typography>
      
            {/* Попытка отрисовать Recharts (если ширина есть и данные есть) */}
            {chartWidth > 0 && byTenant.length > 0 && (
              <BarChart
                width={chartWidth}
                height={320}
                data={byTenant}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                key={`tenants-${latestTime}-${byTenant.length}-${chartWidth}`}
              >
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0}
                       tick={{ fill: '#424242', fontSize: 12 }} />
                <YAxis allowDecimals={false} domain={[0, 'dataMax']}
                       tick={{ fill: '#424242', fontSize: 12 }} />
                <Tooltip />
                {/* ВОТ ТУТ ГЛАВНОЕ: задаём явный цвет столбцов */}
                <Bar dataKey="count" barSize={28} isAnimationActive={false} fill="#1976d2" />
              </BarChart>
            )}
      
            {/* Если Recharts по-прежнему не рисует — покажем подсказку */}
            {chartWidth > 0 && byTenant.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: .7 }}>
                Если график выше пустой при наличии таблицы/ширины — вероятно, глобальные стили
                скрывают SVG. Проверьте, что в CSS нет правил вроде <code>svg &#123; display: none &#125;</code> /
                <code>overflow: hidden</code> на родителях. Ещё проверьте, что нет <code>filter: invert()</code> поверх контейнера.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
