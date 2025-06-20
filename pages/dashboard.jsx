import { Box, Typography, Grid, Card, CardContent, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import TopNav from '../components/TopNav'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [availableTimes, setAvailableTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [summary, setSummary] = useState({
    total: 0,
    working: 0,
    notWorking: 0,
    byTenant: [],
    topIdleWagons: []
  })

  useEffect(() => {
    loadAvailableTimes()
  }, [selectedDate])

  useEffect(() => {
    if (selectedTime) {
      loadDashboardData()
    }
  }, [selectedDate, selectedTime])

  const loadAvailableTimes = async () => {
    const formattedDate = selectedDate.format('YYYY-MM-DD')
    const { data: timesData, error: timesError } = await supabase
      .from('Dislocation_daily2')
      .select('Время отчета')
      .eq('Дата отчета', formattedDate)
      .order('Время отчета', { ascending: true })
    
    if (timesError) {
      console.error('Ошибка при загрузке времен:', timesError)
      setAvailableTimes([])
      setSelectedTime('')
      return
    }
    
    const uniqueTimes = [...new Set(timesData.map(r => r['Время отчета']))]
    
    setAvailableTimes(uniqueTimes)
    if (uniqueTimes.length > 0) {
      setSelectedTime(uniqueTimes[uniqueTimes.length - 1])
    }
    }

  const loadDashboardData = async () => {
    const formattedDate = selectedDate.format('YYYY-MM-DD')
    const { data: wagons, error } = await supabase
      .from('Dislocation_daily2')
      .select(`
        "Номер вагона",
        "Рабочий/нерабочий",
        "Арендатор",
        "Дней без операции"
      `)
      .eq('Дата отчета', formattedDate)
      .eq('Время отчета', selectedTime)

    if (error) {
      console.error('Ошибка при загрузке данных:', error)
      return
    }

    const total = wagons.length
    const working = wagons.filter(w => w['Рабочий/нерабочий'] === 'Рабочий').length
    const notWorking = wagons.filter(w => w['Рабочий/нерабочий'] === 'Не рабочий').length

    const tenants = {}
    wagons.forEach(w => {
      const t = w['Арендатор'] || 'Без арендатора'
      tenants[t] = (tenants[t] || 0) + 1
    })
    const byTenant = Object.entries(tenants).map(([name, count]) => ({ name, count }))

    const topIdleWagons = wagons
      .filter(w => w['Дней без операции'] !== null)
      .sort((a, b) => b['Дней без операции'] - a['Дней без операции'])
      .slice(0, 10)

    setSummary({ total, working, notWorking, byTenant, topIdleWagons })
  }

  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem' }}>
        <Typography variant="h4" gutterBottom>Дэшборд</Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Дата отчета"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
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
            {availableTimes.map((time, idx) => (
              <MenuItem key={idx} value={time}>{time}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="h6">Всего вагонов</Typography>
              <Typography variant="h4">{summary.total}</Typography>
            </CardContent></Card>
          </Grid>

          <Grid item xs={6} md={4}>
            <Card><CardContent>
              <Typography variant="h6">Рабочие</Typography>
              <Typography variant="h4">{summary.working}</Typography>
            </CardContent></Card>
          </Grid>

          <Grid item xs={6} md={4}>
            <Card><CardContent>
              <Typography variant="h6">Не рабочие</Typography>
              <Typography variant="h4">{summary.notWorking}</Typography>
            </CardContent></Card>
          </Grid>

          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6">Вагоны по арендаторам</Typography>
              <ul>
                {summary.byTenant.map((t, idx) => (
                  <li key={idx}>{t.name}: {t.count}</li>
                ))}
              </ul>
            </CardContent></Card>
          </Grid>

          <Grid item xs={12}>
            <Card><CardContent>
              <Typography variant="h6">ТОП-10 вагонов по простоям</Typography>
              <ol>
                {summary.topIdleWagons.map((w, idx) => (
                  <li key={idx}>
                    № {w['Номер вагона']} — {w['Дней без операции']} дн.
                  </li>
                ))}
              </ol>
            </CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
