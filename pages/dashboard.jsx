// pages/dashboard.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
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

// recharts (только на клиенте)
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })
const Cell                = dynamic(() => import('recharts').then(m => m.Cell),                { ssr: false })

const BAR_DEFAULT = '#2196f3'
const BAR_SELECTED = '#ff9800'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [allRowsForDate, setAllRowsForDate] = useState([])   // все строки за дату
  const [availableTimes, setAvailableTimes] = useState([])   // ['HH:mm:ss']
  const [selectedTime, setSelectedTime] = useState('')       // выбранное 'HH:mm:ss'
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [chartsReady, setChartsReady] = useState(false)      // чтобы графики монтировались после layout

  // выбранный арендатор для кросс-фильтра
  const [selectedTenant, setSelectedTenant] = useState('ALL') // 'ALL' | <name>

  useEffect(() => {
    // Дадим лейауту стабилизироваться (фиксы для ResponsiveContainer)
    const t = setTimeout(() => setChartsReady(true), 0)
    return () => clearTimeout(t)
  }, [])

  // --- 1) Грузим все строки по выбранной дате (без фильтра по времени) ---
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

      // уникальные времена, нормализуем к HH:mm:ss
      const timesSet = new Set(
        rows
          .map(r => String(r.vremya_otcheta))
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

  // --- 2) Локальная фильтрация по выбранному времени ---
  const rows = useMemo(() => {
    if (!selectedTime) return []
    const norm = (s) => (String(s).length === 5 ? `${s}:00` : String(s))
    const filtered = allRowsForDate.filter(r => norm(r.vremya_otcheta) === selectedTime)
    console.log('[DASH] selectedTime=', selectedTime, 'filtered rows=', filtered.length)
    return filtered
  }, [allRowsForDate, selectedTime])

  // --- Агрегации ---
  const byTenant = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const key = r.arendator || 'Без арендатора'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
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
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rowsFiltered])

  const top10ByStation = useMemo(() => {
    const map = new Map()
    rowsFiltered.forEach(r => {
      const k = r.stanciya_operacii || 'Без станции'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rowsFiltered])

  // Диагностика составов массивов (можно удалить позже)
  console.log('[DASH] byTenant=', byTenant.length, 'topOps=', top10ByOperation.length, 'topStations=', top10ByStation.length)

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

      {/* Арендаторы (кликабельно) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6">Вагоны по арендаторам</Typography>
            <Button
              size="small"
              onClick={() => setSelectedTenant('ALL')}
              disabled={selectedTenant === 'ALL'}
            >
              Сбросить фильтр
            </Button>
          </Stack>

          {chartsReady && (
            <Box sx={{ width: '100%', minWidth: 320, height: 340 }}>
              <ResponsiveContainer
                key={`tenants-${selectedTime}-${byTenant.length}`}
                width="99%" height="100%"
              >
                <BarChart data={byTenant} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
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
              </ResponsiveContainer>
            </Box>
          )}
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {`Позиции: ${byTenant.length}`}
          </Typography>
        </CardContent>
      </Card>

      {/* Два ТОПа — уже с применённым фильтром */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по операциям</Typography>
              {chartsReady && (
                <Box sx={{ width: '100%', minWidth: 320, height: 340 }}>
                  <ResponsiveContainer
                    key={`ops-${selectedTime}-${top10ByOperation.length}`}
                    width="99%" height="100%"
                  >
                    <BarChart data={top10ByOperation} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {`Позиции: ${top10ByOperation.length}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по станциям операций</Typography>
              {chartsReady && (
                <Box sx={{ width: '100%', minWidth: 320, height: 340 }}>
                  <ResponsiveContainer
                    key={`stations-${selectedTime}-${top10ByStation.length}`}
                    width="99%" height="100%"
                  >
                    <BarChart data={top10ByStation} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {`Позиции: ${top10ByStation.length}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
