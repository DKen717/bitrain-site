// pages/dashboard.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'
import dynamic from 'next/dynamic'

// recharts только на клиенте
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart            = dynamic(() => import('recharts').then(m => m.BarChart),            { ssr: false })
const Bar                 = dynamic(() => import('recharts').then(m => m.Bar),                 { ssr: false })
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false })
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false })
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false })
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false })

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [availableTimes, setAvailableTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [rows, setRows] = useState([])

  // 1) подгружаем доступные времена для выбранной даты
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setErrorText('')
      const d = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select('"Время отчета"')
        .eq('Дата отчета', d)
        .order('"Время отчета"', { ascending: true })
      if (error) { if (!ignore) setErrorText(error.message); return }
      const uniq = [...new Set((data || []).map(r => r['Время отчета']).filter(Boolean))]
      if (!ignore) {
        setAvailableTimes(uniq)
        setSelectedTime(uniq[uniq.length - 1] || '')
      }
    })()
    return () => { ignore = true }
  }, [selectedDate])

  // 2) загружаем строки для выбранных даты/времени
  const loadRows = useCallback(async () => {
    if (!selectedTime) { setRows([]); return }
    setLoading(true); setErrorText('')
    try {
      const d = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select(`
          "Номер вагона",
          "Наименование операции",
          "Станция операции",
          "Дней без операции"
        `)
        .eq('Дата отчета', d)
        .eq('Время отчета', selectedTime)

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

  // === Агрегации на клиенте ===
  const top10ByOperation = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const k = r['Наименование операции'] || 'Без операции'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rows])

  const top10ByStation = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const k = r['Станция операции'] || 'Без станции'
      map.set(k, (map.get(k) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rows])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дэшборд</Typography>

      {/* Дата и время в ОДНУ строку */}
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

      <Grid container spacing={2}>
        {/* ТОП-10 по операциям */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по операциям</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top10ByOperation}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
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

        {/* ТОП-10 по станциям */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ТОП-10 по станциям (операции)</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top10ByStation}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
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
