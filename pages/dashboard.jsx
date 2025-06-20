import { Box, Typography, Grid, Card, CardContent } from '@mui/material'
import TopNav from '../components/TopNav'
import DatePicker from '@mui/lab/DatePicker'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [summary, setSummary] = useState({
    total: 0,
    working: 0,
    notWorking: 0,
    byTenant: [],
    topIdleWagons: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [selectedDate])

  const loadDashboardData = async () => {
    const formattedDate = selectedDate.format('YYYY-MM-DD')

    // 1. Количество всех вагонов по дате
    const { data: wagons } = await supabase
      .from('Dislocation_daily2')
      .select(`
        "Номер вагона",
        "Рабочий/нерабочий",
        "Арендатор",
        "Дней без операции"
      `)
      .eq('Дата отчета', formattedDate)

    const total = wagons.length
    const working = wagons.filter(w => w['Рабочий/нерабочий'] === 'Рабочий').length
    const notWorking = wagons.filter(w => w['Рабочий/нерабочий'] === 'Не рабочий').length

    // 2. Считаем по арендаторам
    const tenants = {}
    wagons.forEach(w => {
      const t = w['Арендатор'] || 'Без арендатора'
      tenants[t] = (tenants[t] || 0) + 1
    })
    const byTenant = Object.entries(tenants).map(([name, count]) => ({ name, count }))

    // 3. ТОП-10 вагонов по "Дней без операции"
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

        {/* Дата */}
        <DatePicker
          label="Дата отчета"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          renderInput={(params) => <Box component="span" sx={{ mb: 2 }}><TextField {...params} /></Box>}
        />

        <Grid container spacing={2} mt={2}>
          {/* Общая статистика */}
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

          {/* По арендаторам */}
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

          {/* ТОП-10 вагонов без операций */}
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
