import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const TENANT_COLOR = '#2196f3'
const TENANT_COLOR_SELECTED = '#ff9800'
const STATUS_COLORS = ['#4caf50', '#f44336'] // Рабочие / Нерабочие

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [availableTimes, setAvailableTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  // сырые строки из базы по выбранной дате/времени
  const [rows, setRows] = useState([])

  // кросс-фильтр
  const [selectedTenant, setSelectedTenant] = useState(null) // 'ALL' | null | <name>

  // 1) загрузка доступных времен для даты
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setErrorText('')
      const formattedDate = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select('"Время отчета"')
        .eq('Дата отчета', formattedDate)
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

  // 2) загрузка данных по выбранным дате/времени
  const loadRows = useCallback(async () => {
    if (!selectedTime) { setRows([]); return }
    setLoading(true)
    setErrorText('')
    try {
      const formattedDate = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select(`
          "Номер вагона",
          "Рабочий/нерабочий",
          "Арендатор",
          "Дней без операции"
        `)
        .eq('Дата отчета', formattedDate)
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

  // === Аггрегации на клиенте ===

  // KPI по статусам
  const statusSummary = useMemo(() => {
    const working = rows.filter(r => r['Рабочий/нерабочий'] === 'Рабочий').length
    const notWorking = rows.filter(r => r['Рабочий/нерабочий'] === 'Нерабочий').length
    return { working, notWorking, total: working + notWorking }
  }, [rows])

  const statusPieData = useMemo(() => ([
    { name: 'Рабочие', value: statusSummary.working },
    { name: 'Нерабочие', value: statusSummary.notWorking }
  ]), [statusSummary])

  // Аггрегация по арендаторам
  const byTenant = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const key = r['Арендатор'] || 'Без арендатора'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])

  // Применяем фильтр арендатора
  const rowsFiltered = useMemo(() => {
    if (!selectedTenant || selectedTenant === 'ALL') return rows
    return rows.filter(r => (r['Арендатор'] || 'Без арендатора') === selectedTenant)
  }, [rows, selectedTenant])

  // Топ-10 по простоям (учитывает фильтр)
  const topIdle = useMemo(() => {
    return rowsFiltered
      .filter(r => r['Дней без операции'] != null)
      .sort((a, b) => (b['Дней без операции'] ?? 0) - (a['Дней без операции'] ?? 0))
      .slice(0, 10)
  }, [rowsFiltered])

  // KPI с учётом фильтра арендатора
  const filteredStatus = useMemo(() => {
    const working = rowsFiltered.filter(r => r['Рабочий/нерабочий'] === 'Рабочий').length
    const notWorking = rowsFiltered.filter(r => r['Рабочий/нерабочий'] === 'Нерабочий').length
    return { working, notWorking, total: rowsFiltered.length }
  }, [rowsFiltered])

  const filteredStatusPie = useMemo(() => ([
    { name: 'Рабочие', value: filteredStatus.working },
    { name: 'Нерабочие', value: filteredStatus.notWorking }
  ]), [filteredStatus])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дэшборд</Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Дата отчета"
          value={selectedDate}
          onChange={(v) => setSelectedDate(v)}
          slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
        />
      </LocalizationProvider>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Время отчета</InputLabel>
        <Select
          value={selectedTime}
          label="Время отчета"
          onChange={(e) => setSelectedTime(e.target.value)}
        >
          {availableTimes.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
        </Select>
      </FormControl>

      {/* Ошибки/загрузка */}
      {errorText && (
        <Typography color="error" sx={{ mt: 2 }}>{errorText}</Typography>
      )}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <CircularProgress size={20} /> <Typography>Загрузка…</Typography>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* KPI по всей выборке */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Всего вагонов</Typography>
            <Typography variant="h4">{statusSummary.total}</Typography>
            {selectedTenant && selectedTenant !== 'ALL' && (
              <Typography variant="body2" sx={{ mt: .5 }}>Фильтр по: <b>{selectedTenant}</b></Typography>
            )}
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Рабочие</Typography>
            <Typography variant="h4">{statusSummary.working}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Нерабочие</Typography>
            <Typography variant="h4">{statusSummary.notWorking}</Typography>
          </CardContent></Card>
        </Grid>

        {/* Пирог статусов (по общему срезу) */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Статус (общий)</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={90}>
                  {statusPieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>

        {/* Бар по арендаторам (кликабельно) */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Вагоны по арендаторам</Typography>
              <Button size="small" onClick={() => setSelectedTenant('ALL')} disabled={!selectedTenant || selectedTenant === 'ALL'}>
                Сбросить фильтр
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byTenant} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" isAnimationActive={false} onClick={(d) => setSelectedTenant(d.name)}>
                  {byTenant.map((t, i) => (
                    <Cell
                      key={i}
                      cursor="pointer"
                      fill={
                        selectedTenant && selectedTenant !== 'ALL' && t.name === selectedTenant
                          ? TENANT_COLOR_SELECTED
                          : TENANT_COLOR
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {selectedTenant && selectedTenant !== 'ALL' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Фильтр: <b>{selectedTenant}</b>
              </Typography>
            )}
          </CardContent></Card>
        </Grid>

        {/* Пирог статусов для выбранного арендатора (динамический срез) */}
        {selectedTenant && selectedTenant !== 'ALL' && (
          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6" gutterBottom>Статус (фильтр по: {selectedTenant})</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={filteredStatusPie} dataKey="value" nameKey="name" outerRadius={90}>
                    {filteredStatusPie.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </Grid>
        )}

        {/* Топ-10 простоев */}
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>ТОП-10 вагонов по простоям</Typography>
            <ol style={{ marginTop: 8 }}>
              {topIdle.map((w, idx) => (
                <li key={idx}>
                  № {w['Номер вагона']} — {w['Дней без операции']} дн. ({w['Арендатор'] || 'Без арендатора'})
                </li>
              ))}
              {!topIdle.length && <Typography variant="body2">Нет данных для выбранного фильтра.</Typography>}
            </ol>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}
