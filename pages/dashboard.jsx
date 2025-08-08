import { useEffect, useMemo, useState, useCallback } from 'react'
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '../src/supabaseClient'
import dayjs from 'dayjs'

const STATUS_COLORS = ['#4caf50', '#f44336'] // Рабочие / Нерабочие
const TENANT_COLOR = '#2196f3'
const TENANT_COLOR_SELECTED = '#ff9800'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [availableTimes, setAvailableTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState('')

  // агрегаты с бэка
  const [byTenant, setByTenant] = useState([]) // [{name, count}]
  const [statusSummary, setStatusSummary] = useState({ working: 0, notWorking: 0, total: 0 })
  const [topIdle, setTopIdle] = useState([]) // [{Номер вагона, Дней без операции, Арендатор}]

  // локальный фильтр
  const [selectedTenant, setSelectedTenant] = useState(null)

  useEffect(() => {
    (async () => {
      const formattedDate = selectedDate.format('YYYY-MM-DD')
      const { data, error } = await supabase
        .from('Dislocation_daily2')
        .select('"Время отчета"')
        .eq('Дата отчета', formattedDate)
        .order('"Время отчета"', { ascending: true })

      if (error) { console.error(error); return }
      const uniq = [...new Set((data || []).map(r => r['Время отчета']))]
      setAvailableTimes(uniq)
      setSelectedTime(uniq[uniq.length - 1] || '')
    })()
  }, [selectedDate])

  useEffect(() => {
    if (!selectedTime) return
    fetchAggregates()
  }, [selectedDate, selectedTime])

  const fetchAggregates = useCallback(async () => {
    const date = selectedDate.format('YYYY-MM-DD')

    // 1) По арендаторам
    const { data: tenants, error: tErr } = await supabase.rpc('agg_by_tenant', {
      p_date: date, p_time: selectedTime
    })
    if (tErr) console.error(tErr)
    setByTenant((tenants || []).map(r => ({ name: r.tenant ?? 'Без арендатора', count: r.cnt })))

    // 2) По статусам
    const { data: statuses, error: sErr } = await supabase.rpc('agg_status', {
      p_date: date, p_time: selectedTime
    })
    if (sErr) console.error(sErr)
    const working = statuses?.[0]?.working ?? 0
    const notWorking = statuses?.[0]?.not_working ?? 0
    setStatusSummary({ working, notWorking, total: working + notWorking })

    // 3) Топ-10 простоев (с опциональным фильтром арендатора на сервере можно тоже сделать)
    const { data: top, error: iErr } = await supabase.rpc('top_idle', {
      p_date: date, p_time: selectedTime
    })
    if (iErr) console.error(iErr)
    setTopIdle(top || [])
  }, [selectedDate, selectedTime])

  // клиентский кросс-фильтр (если не вынес в RPC)
  const filteredTopIdle = useMemo(() => {
    if (!selectedTenant || selectedTenant === 'ALL') return topIdle
    return topIdle.filter(w => (w['Арендатор'] ?? 'Без арендатора') === selectedTenant)
  }, [topIdle, selectedTenant])

  const statusPieData = useMemo(() => ([
    { name: 'Рабочие', value: statusSummary.working },
    { name: 'Нерабочие', value: statusSummary.notWorking }
  ]), [statusSummary])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дэшборд</Typography>

      {/* KPI */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Всего вагонов</Typography>
            <Typography variant="h4">{statusSummary.total}</Typography>
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

        {/* Pie статус */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Статус</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={90}>
                  {statusPieData.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </Grid>

        {/* Bar арендаторы (кликабельно) */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Вагоны по арендаторам</Typography>
              <Button size="small" onClick={() => setSelectedTenant('ALL')} disabled={!selectedTenant || selectedTenant==='ALL'}>
                Сбросить фильтр
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byTenant} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="count"
                  onClick={(d) => setSelectedTenant(d.name)}
                  isAnimationActive={false}
                >
                  {byTenant.map((t, i) => (
                    <Cell
                      key={i}
                      fill={selectedTenant && selectedTenant !== 'ALL' && t.name === selectedTenant
                        ? TENANT_COLOR_SELECTED
                        : TENANT_COLOR}
                      cursor="pointer"
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

        {/* Топ-10 простоев (учитывает фильтр) */}
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>ТОП-10 вагонов по простоям</Typography>
            <ol style={{ marginTop: 8 }}>
              {filteredTopIdle.map((w, idx) => (
                <li key={idx}>
                  № {w['Номер вагона']} — {w['Дней без операции']} дн. ({w['Арендатор'] ?? 'Без арендатора'})
                </li>
              ))}
            </ol>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  )
}
