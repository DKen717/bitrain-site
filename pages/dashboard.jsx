// pages/dashboard.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box, Grid, Card, CardContent, Typography, Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Divider,
  Chip, Button
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dynamic from 'next/dynamic'
import AppLayout from '../components/AppLayout'
import { supabase } from '../src/supabaseClient'

// ——— Надёжный Recharts: импорт внутри компонента, ssr: false
const TenantsChart = dynamic(() =>
  Promise.resolve(function TenantsChartImpl({ width, height, data, activeTenant, onPickTenant }) {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } = require('recharts')
    return (
      <BarChart width={width} height={height} data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid stroke="hsl(var(--table-border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-20}
          textAnchor="end"
          height={60}
          interval={0}
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
        />
        <YAxis allowDecimals={false} domain={[0, 'dataMax']} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" barSize={28} isAnimationActive={false}>
          {data.map((d) => (
            <Cell
              key={d.name}
              cursor="pointer"
              onClick={() => onPickTenant?.(d.name)}
              fill={activeTenant === d.name ? 'hsl(var(--chart-primary))' : 'hsl(var(--chart-accent))'}
            />
          ))}
        </Bar>
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
    const onResize = () => setWidth(el.getBoundingClientRect().width || 0)
    onResize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); ro.disconnect() }
  }, [])
  return [ref, width]
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs())

  // время среза
  const [latestTimeRaw, setLatestTimeRaw] = useState('')   // как в БД (HH:MM[:SS])
  const [latestTimeDisp, setLatestTimeDisp] = useState('') // HH:MM для подписи

  // данные
  const [rowsSlice, setRowsSlice] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [errorText, setErrorText] = useState('')

  // интерактивные фильтры
  const [active, setActive] = useState({ working: '', tenant: '' })

  const [chartRef, chartWidth] = useContainerWidth()

  // 1) последнее время за дату
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setErrorText(''); setLatestTimeRaw(''); setLatestTimeDisp('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('vremya_otcheta')
          .eq('data_otcheta', d)
          .not('vremya_otcheta', 'is', null)

        if (error) throw error

        const times = [...new Set((data || []).map(r => String(r.vremya_otcheta)).filter(Boolean))]
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

  // 2) срез на дату+время (берём только нужные поля)
  useEffect(() => {
    let canceled = false
    ;(async () => {
      if (!latestTimeRaw) { setRowsSlice([]); return }
      setLoading(true); setErrorText('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('rabochij_nerabochij, arendator, nomer_vagona, dney_bez_operacii, prostoj_na_stancii, stanciya_operacii')
          .eq('data_otcheta', d)
          .eq('vremya_otcheta', latestTimeRaw)

        if (error) throw error
        if (!canceled) setRowsSlice(data || [])
      } catch (e) {
        if (!canceled) { setRowsSlice([]); setErrorText(e.message || 'Ошибка загрузки данных') }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [selectedDate, latestTimeRaw])

  // 3) применяем фильтры
  const filteredRows = useMemo(() => {
    return (rowsSlice || []).filter(r => {
      if (active.working && r.rabochij_nerabochij !== active.working) return false
      if (active.tenant) {
        const t = (r.arendator && String(r.arendator).trim()) || 'Без арендатора'
        if (t !== active.tenant) return false
      }
      return true
    })
  }, [rowsSlice, active])

  // 4) KPI на основе ОТФИЛЬТРОВАННЫХ строк
  const kpi = useMemo(() => {
    const total = filteredRows.length
    const working = filteredRows.filter(r => r.rabochij_nerabochij === 'Рабочий').length
    const notWorking = filteredRows.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
    return { total, working, notWorking }
  }, [filteredRows])

  // 5) агрегат по арендаторам (топ-15) — тоже после фильтра
  const byTenant = useMemo(() => {
    const map = new Map()
    filteredRows.forEach(r => {
      const k = (r.arendator && String(r.arendator).trim()) || 'Без арендатора'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [filteredRows])

  // 6) топы — после фильтра
  const topNoOps = useMemo(() => {
    return filteredRows
      .map(r => ({
        wagon:  r.nomer_vagona ?? '',
        tenant: r.arendator ?? '',
        days:   Number(r.dney_bez_operacii ?? 0)
      }))
      .filter(x => x.wagon && Number.isFinite(x.days) && x.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10)
  }, [filteredRows])

  const topDwell = useMemo(() => {
    return filteredRows
      .map(r => ({
        wagon:   r.nomer_vagona ?? '',
        station: r.stanciya_operacii ?? '',
        days:    Number(r.prostoj_na_stancii ?? 0)
      }))
      .filter(x => x.wagon && x.station && Number.isFinite(x.days) && x.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10)
  }, [filteredRows])

  const subtitle = useMemo(() => {
    const d = selectedDate.format('DD.MM.YYYY')
    const t = latestTimeDisp || '—'
    return `Срез на ${d} ${t}`
  }, [selectedDate, latestTimeDisp])

  // ——— helpers
  const toggleWorking = (value) =>
    setActive(prev => ({ ...prev, working: prev.working === value ? '' : value }))

  const pickTenant = (name) =>
    setActive(prev => ({ ...prev, tenant: prev.tenant === name ? '' : name }))

  const clearAll = () => setActive({ working: '', tenant: '' })

  // стили активных карточек KPI
  const activeCardSX = {
    borderColor: 'primary.main',
    boxShadow: '0 0 0 1px hsl(var(--border))',
    bgcolor: 'hsl(var(--secondary))',
    cursor: 'pointer'
  }

  return (
    <AppLayout collapsedDefault>
      <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>Дэшборд</Typography>
      <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>{subtitle}</Typography>

      {/* Фильтры (чипы) */}
      {(active.working || active.tenant) && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
          {active.working && (
            <Chip label={`Статус: ${active.working}`} onDelete={() => setActive(s => ({ ...s, working: '' }))} />
          )}
          {active.tenant && (
            <Chip label={`Арендатор: ${active.tenant}`} onDelete={() => setActive(s => ({ ...s, tenant: '' }))} />
          )}
          <Button size="small" onClick={clearAll}>Сбросить всё</Button>
        </Stack>
      )}

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

      {/* KPI — кликабельные */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card
            onClick={() => setActive(s => ({ ...s, working: '' }))} // «Всего» снимает фильтр по статусу
            sx={{ cursor: 'pointer', ...(active.working === '' ? activeCardSX : {}) }}
          >
            <CardContent>
              <Typography variant="subtitle2">Всего вагонов</Typography>
              <Typography variant="h3">{loading ? '…' : kpi.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            onClick={() => toggleWorking('Рабочий')}
            sx={{ cursor: 'pointer', ...(active.working === 'Рабочий' ? activeCardSX : {}) }}
          >
            <CardContent>
              <Typography variant="subtitle2">Рабочие</Typography>
              <Typography variant="h3">{loading ? '…' : kpi.working}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            onClick={() => toggleWorking('Нерабочий')}
            sx={{ cursor: 'pointer', ...(active.working === 'Нерабочий' ? activeCardSX : {}) }}
          >
            <CardContent>
              <Typography variant="subtitle2">Нерабочие</Typography>
              <Typography variant="h3">{loading ? '…' : kpi.notWorking}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* График: Вагоны по арендаторам */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Вагоны по арендаторам (топ-15)</Typography>
          <Box ref={chartRef} sx={{ width: '100%', minWidth: 320 }}>
            {chartWidth > 0 && byTenant.length > 0 ? (
              <TenantsChart
                width={chartWidth}
                height={CHART_HEIGHT}
                data={byTenant}
                activeTenant={active.tenant}
                onPickTenant={pickTenant}
              />
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
                      <TableRow
                        key={i}
                        hover
                        sx={{ cursor: r.tenant ? 'pointer' : 'default' }}
                        onClick={() => r.tenant && pickTenant(r.tenant)}
                        title={r.tenant ? `Фильтровать по арендатору: ${r.tenant}` : ''}
                      >
                        <TableCell>{r.wagon}</TableCell>
                        <TableCell>{r.tenant || '—'}</TableCell>
                        <TableCell align="right">{r.days}</TableCell>
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
                        <TableCell>{r.wagon}</TableCell>
                        <TableCell>{r.station || '—'}</TableCell>
                        <TableCell align="right">{r.days}</TableCell>
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
