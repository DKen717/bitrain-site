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

// recharts только на клиенте (чтобы не падать на SSR)
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
  const [availableTimes, setAvailableTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [rows, setRows] = useState([])

  // выбранный арендатор для кросс-фильтра
  const [selectedTenant, setSelectedTenant] = useState('ALL') // 'ALL' | <name>

  // --- 1) Времена отчета для даты ---
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setErrorText('')
      const d = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily')
        .select('vremya_otcheta')
        .eq('data_otcheta', d)
        .order('vremya_otcheta', { ascending: true })

      if (error) { if (!ignore) setErrorText(error.message); return }

      const uniq = [...new Set((data || []).map(r => r.vremya_otcheta).filter(Boolean))]
      if (!ignore) {
        setAvailableTimes(uniq)
        setSelectedTime(uniq[uniq.length - 1] || '')
      }
    })()
    return () => { ignore = true }
  }, [selectedDate])

  // --- 2) Строки для выбранных даты/времени ---
  const loadRows = useCallback(async () => {
    if (!selectedTime) { setRows([]); return }
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
          dney_bez_operacii
        `)
        .eq('data_otcheta', d)
        .eq('vremya_otcheta', selectedTime)

      if (error) throw error
      setRows(data || [])
    } catch (e) {
      setErrorText(e.message || 'Ошибка загрузки')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedTime])

  useEffect(() => { loadRows() }, [loadRows])

  // --- Агрегации ---

  // Все арендаторы (для чарта — НЕ фильтруем, чтобы был полный список)
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

  // Отфильтрованные строки (по выбранному арендатору)
  const rowsFiltered = useMemo(() => {
    if (selectedTenant === 'ALL') return rows
    return rows.filter(r => (r.arendator || 'Без арендатора') === selectedTenant)
  }, [rows, selectedTenant])

  // KPI (подчиняются фильтру)
  const statusSummary = useMemo(() => {
    const working = rowsFiltered.filter(r => r.rabochij_nerabochij === 'Рабочий').length
    const notWorking = rowsFiltered.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
    return { working, notWorking, total: rowsFiltered.length }
  }, [rowsFiltered])

  // ТОП-10 по операциям (после фильтра)
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

  // ТОП-10 по станциям (после фильтра)
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
            <InputLabel>Время отчета</InputLabel>
            <Select
              value={selectedTime}
              label="Время отчета"
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {availableTimes.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
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

          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTenant} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  isAnimationActive={false}
                  onClick={(entry) => setSelectedTenant(entry.name)}
                >
                  {byTenant.map((t, i) => (
                    <Cell
                      key={i}
                      cursor="pointer"
                      fill={selectedTenant !== 'ALL' && t.name === selectedTenant ? BAR_SELECTED : BAR_DEFAULT}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          {selectedTenant !== 'ALL' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Активный фильтр: <b>{selectedTenant}</b>
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Два ТОПа — уже с применённым фильтром */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по операциям</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ByOperation} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по станциям операций</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ByStation} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
