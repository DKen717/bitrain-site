// pages/index.jsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  Divider,
  Stack
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import BarChartIcon from '@mui/icons-material/BarChart'
import PlaceIcon from '@mui/icons-material/Place'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import SecurityIcon from '@mui/icons-material/Security'
import TrainIcon from '@mui/icons-material/Train'
import GroupsIcon from '@mui/icons-material/Groups'
import TimelineIcon from '@mui/icons-material/Timeline'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { supabase } from '../src/supabaseClient'

const features = [
  { icon: BarChartIcon, title: 'Аналитика', description: 'Комплексные отчёты и визуализация по парку вагонов и операциям' },
  { icon: PlaceIcon, title: 'Онлайн-дислокация', description: 'Мониторинг расположения вагонов с минимальной задержкой' },
  { icon: FlashOnIcon, title: 'Автоматизация', description: 'Сценарии и процессы для ускорения ежедневной работы' },
  { icon: SecurityIcon, title: 'Безопасность', description: 'RLS, разграничение доступа и защита ваших данных' }
]

const stats = [
  { label: 'Активные вагоны', value: '2 847', icon: TrainIcon },
  { label: 'Партнёры', value: '156', icon: GroupsIcon },
  { label: 'Ежедневные операции', value: '1 203', icon: TimelineIcon },
  { label: 'Доступность', value: '99,9%', icon: TrendingUpIcon }
]

// full-bleed секции (обход общего Container в _app.js)
const fullBleedSX = {
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  width: '100vw'
}

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  // Оставил твой редирект на /home (если у тебя уже есть /dashboard — поменяй здесь)
  useEffect(() => {
    if (session) router.replace('/home')
  }, [session, router])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Head>
        <title>BI Train — Railway Freight Analytics</title>
        <meta name="description" content="BI Train — аналитика и мониторинг парка вагонов: дислокация, отчёты, KPI." />
      </Head>

      {/* HERO */}
      <Box
        component="section"
        sx={(t) => ({
          ...fullBleedSX,
          py: { xs: 10, md: 14 },
          background: `linear-gradient(135deg,
            ${alpha(t.palette.primary.main, 0.06)},
            ${alpha(t.palette.primary.main, 0.12)}
          )`
        })}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Платформа <Box component="span" sx={{ color: 'primary.main' }}>BI Train</Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>
              Аналитика и мониторинг железнодорожных перевозок: парк вагонов, дислокация, операции и KPI — в одном окне.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button size="large" variant="contained" component={Link} href="/login" sx={{ px: 4, py: 1.5 }}>
                Войти
              </Button>
              <Button size="large" variant="outlined" component={Link} href="#features" sx={{ px: 4, py: 1.5 }}>
                Узнать больше
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* СТАТИСТИКА */}
      <Box component="section" sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <Grid key={i} item xs={6} md={3}>
                  <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                    <CardHeader
                      title={s.label}
                      titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      avatar={
                        <Box
                          aria-hidden
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            opacity: 0.12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon sx={{ color: 'primary.main' }} />
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Typography variant="h4" fontWeight={800}>{s.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Container>
      </Box>

      {/* ФИЧИ */}
      <Box id="features" component="section" sx={{ py: { xs: 10, md: 12 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Возможности
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Удобные инструменты для управления парком и принятия решений на основе данных
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <Grid key={i} item xs={12} sm={6} md={3}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      transition: 'box-shadow .2s, transform .2s',
                      '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
                    }}
                  >
                    <CardHeader
                      title={f.title}
                      titleTypographyProps={{ variant: 'h6' }}
                      avatar={
                        <Box
                          aria-hidden
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            opacity: 0.12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 1
                          }}
                        >
                          <Icon sx={{ color: 'primary.main' }} />
                        </Box>
                      }
                    />
                    <CardContent>
                      <Typography color="text.secondary">{f.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        component="section"
        sx={(t) => ({
          ...fullBleedSX,
          py: { xs: 10, md: 12 },
          bgcolor: t.palette.primary.main,
          color: t.palette.primary.contrastText
        })}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Готовы оптимизировать работу?
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              Присоединяйтесь к платформе BI Train.
            </Typography>
            <Button
              size="large"
              variant="contained"
              component={Link}
              href="/login"
              sx={{
                px: 4,
                py: 1.5,
                bgcolor: 'common.white',
                color: 'primary.main',
                '&:hover': { bgcolor: alpha('#FFFFFF', 0.9) }
              }}
            >
              Войти
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
