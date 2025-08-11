// pages/dashboard.jsx
import { useEffect, useMemo, useState } from 'react'
import { Box, Grid, Card, CardContent, Typography, FormControl, InputLabel } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { supabase } from '../src/supabaseClient'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())      // дата отчёта
  const [latestTime, setLatestTime] = useState('')               // 'HH:mm:ss' за дату
  const [counts, setCounts] = useState({ total: 0, working: 0, notWorking: 0 })
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  // 1) Находим последнее время за выбранную дату
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setErrorText('')
      setLatestTime('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')

        // тянем только времена за дату
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('vremya_otcheta')
          .eq('data_otcheta', d)
          .not('vremya_otcheta', 'is', null)

        if (error) throw error

        // нормализуем к HH:mm:ss и берём максимальное
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

  // 2) Считаем KPI для (дата + последнее время)
  useEffect(() => {
    let canceled = false
    ;(async () => {
      if (!latestTime) { setCounts({ total: 0, working: 0, notWorking: 0 }); return }
      setLoading(true); setErrorText('')
      try {
        const d = selectedDate.format('YYYY-MM-DD')

        // Берём только нужные поля, считаем на клиенте
        const { data, error } = await supabase
          .from('Dislocation_daily')
          .select('rabochij_nerabochij')
          .eq('data_otcheta', d)
          .eq('vremya_otcheta', latestTime)

        if (error) throw error

        const rows = data || []
        const working = rows.filter(r => r.rabochij_nerabochij === 'Рабочий').length
        const notWorking = rows.filter(r => r.rabochij_nerabochij === 'Нерабочий').length
        const total = rows.length

        if (!canceled) setCounts({ total, working, notWorking })
      } catch (e) {
        if (!canceled) {
          setCounts({ total: 0, working: 0, notWorking: 0 })
          setErrorText(e.message || 'Ошибка загрузки данных')
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [selectedDate, latestTime])

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

      {/* Три KPI */}
      <Grid container spacing={2}>
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
    </Box>
  )
}
