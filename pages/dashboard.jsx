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

// ✅ Надёжная обёртка Recharts: импорт внутри компонента, ssr: false
const TenantsChart = dynamic(() =>
  Promise.resolve(function TenantsChartImpl({ width, height, data }) {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = require('recharts')
    const BarRectShape = (props) => {
      const { x, y, width: w, height: h } = props
      if (!w || !h || w <= 0 || h <= 0) return null
      return <rect x={x} y={y} width={w} height={h} fill="hsl(var(--chart-primary))" />
    }
    return (
      <BarChart width={width} height={height} data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
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
        <Bar dataKey="count" barSize={28} isAnimationActive={false} shape={<BarRectShape />} />
      </BarChart>
    )
  }), { ssr: false }
)

const CHART_HEIGHT = 320

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

  // время среза: raw — как в БД, disp — 'HH:MM' для UI
  const [latestTimeRaw, setLatestTimeRaw] = useState('')
  const [latestTimeDisp, setLatestTimeDisp] = useState('')

  const [counts, setCounts] = useState({ total: 0, working: 0, notWorking: 0 })
  const [rowsSlice, setRowsSlice] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [errorText, setErrorText] = useState('')

  const [chartRef, chartWidth] = useContainerWidth()

  // 1) Последнее время за дату
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setErrorText('')
      setLatestTimeRaw(''); setLatestTimeDisp('')
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
        )]
          .map(raw => ({ raw, norm: raw.length === 5 ? `${raw}:00` : raw }))
          .sort((a,b) => a.norm.localeCompare(b.norm))

        const last = times.at(-1)
        if (!canceled && last) {
          setLatestTimeRaw(last.raw)
          setLatestTimeDisp(last.norm.slice(0,5))
        }
      } catch (e) {
        if (!canceled) setErrorText(e.message || 'Ошибка загрузки времени')
      }
    })()
    return () => { canceled = true }
  }, [selectedDate])

  // 2) Срез на дату+время
  useEffect(() => {
    let canceled = false
    ;(async () => {
      if (!latestTimeRaw) { setCounts({ total: 0, working: 0, notWorking: 0 }); setRowsSlice([]); return }
      setLoading(true); setErrorText('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('*')
          .eq('data_otcheta', d)
          .eq('vremya_otcheta', latestTimeRaw)

        if (error) throw error

        const rows = data || []
        const working = rows.filter(r => r.rabochij_nerabochij === 'Рабочий').length
        const notWorking = rows.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
        const total = rows.length

        if (!canceled) { setCounts({ total, working, notWorking }); setRowsSlice(rows) }
      } catch (e) {
        if (!canceled) { setCounts({ total: 0, working: 0, notWorking: 0 }); setRowsSlice([]); setErrorText(e.message || 'Ошибка загрузки данных') }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [selectedDate, latestTimeRaw])

  // 3) Агрегация по арендаторам (топ-15)
  const byTenant = useMemo(() => {
    const map = new Map()
    rowsSlice.forEach(r => {
      const k = r.arendator || r.tenant || 'Без арендатора'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [rowsSlice])

  // ---- детектор полей ----
  const getNum = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const pickFirstNumber = (row, keys) => {
    for (const k of keys) {
      const n = getNum(row?.[k])
      if (n !== null) return n
    }
    return null
  }
  const pickFirstDate = (row, keys) => {
    for (const k of keys) {
      const v = row?.[k]
      if (!v) continue
      const d = dayjs(v)
      if (d.isValid()) return d
    }
    return null
  }

  // 4) Топ-10 без операций: сначала пробуем числовые поля, иначе считаем от даты последней операции
  const topNoOps = useMemo(() => {
    const numKeys = ['days_no_ops','bez_operacii_dney','bez_operacij_dney','days_without_ops','idle_days']
    const dateKeys = ['last_operation_date','data_posled_operacii','posled_operaciya_data','last_op_at','data_posled_op']

    const by = rowsSlice
      .map(r => {
        const wagon = r.vagon_no || r.vagon || r.wagon_no || r.wagon || ''
        const tenant = r.arendator || r.tenant || ''
        let days = pickFirstNumber(r, numKeys)
        if (days === null) {
          const d = pickFirstDate(r, dateKeys)
          if (d) days = dayjs(selectedDate.format('YYYY-MM-DD')).diff(d.startOf('day'), 'day')
        }
        return { wagon, tenant, days: getNum(days) ?? 0 }
      })
      .filter(x => x.wagon && x.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10)

    return by
  }, [rowsSlice, selectedDate])

  // 5) Топ-10 простоя на станции: числовые поля или считаем от даты прибытия/начала простоя
  const topDwell = useMemo(() => {
    const numKeys = ['prostoi_dney','dwell_days','idle_days_station','prostoi','prostoi_dni']
    const dateKeys = ['arrival_station_date','data_pribytiya','data_na_stantcii_s','prostoi_start_date','data_nachala_prostoya']

    const by = rowsSlice
      .map(r => {
        const wagon = r.vagon_no || r.vagon || r.wagon_no || r.wagon || ''
        const station = r.stantziya || r.stantciya || r.station || r.station_name || ''
        let days = pickFirstNumber(r, numKeys)
        if (days === null) {
          const d = pickFirstDate(r, dateKeys)
          if (d) days = dayjs(selectedDate.format('YYYY-MM-DD')).diff(d.startOf('day'), 'day')
        }
        return { wagon, station, days: getNum(days) ?? 0 }
      })
      .filter(x => x.wagon && x.station && x.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10)

    return by
  }, [rowsSlice, selectedDate])

  const subtitle = useMemo(() => {
    const d = selectedDate.format('DD.MM.YYYY')
    const t = latestTimeDisp || '—'
    return `Срез на ${d} ${t}`
  }, [selectedDate, latestTimeDisp])

  // (dev) Подсказываем, какие ключи увидели, если «топы» пустые
  const showFieldHint = !loading && rowsSlice.length > 0 && topNoOps.length === 0 && topDwell.length === 0

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

      {/* График по арендаторам */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Вагоны по арендаторам (топ-15)</Typography>
          <Box ref={chartRef} sx={{ width: '100%', minWidth: 320 }}>
            {chartWidth > 0 && byTenant.length > 0 ? (
              <TenantsChart width={chartWidth} height={CHART_HEIGHT} data={byTenant} />
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
                {loading && <CircularProgress size={18} />}
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
                {loading && <CircularProgress size={18} />}
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

      {showFieldHint && (
        <Alert sx={{ mt: 2 }} severity="info">
          Для расчёта «топов» не найдено подходящих колонок. 
          Проверь, есть ли в <strong>Dislocation_daily</strong> поля вроде:
          <code> days_no_ops / bez_operacii_dney / prostoi_dney </code> или даты
          <code> last_operation_date / data_pribytiya / data_nachala_prostoya</code>.
          Если названия другие — скажи, я подставлю точно.
        </Alert>
      )}
    </AppLayout>
  )
}
