// pages/index.js (MUI look & feel ≈ вашему Tailwind/shadcn примеру)
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
  {
    icon: BarChartIcon,
    title: 'Аналитика',
    description:
      'Комплексная аналитика парка вагонов и визуализация данных'
  },
  {
    icon: PlaceIcon,
    title: 'В реальном времени',
    description:
      'Мониторинг дислокации вагонов и операции с минимальной задержкой'
  },
  {
    icon: FlashOnIcon,
    title: 'Автоматизация процессов',
    description:
      'Автоматизация процессов управления парка вагонов'
  },
  {
    icon: SecurityIcon,
    title: 'Безопасность',
    description:
      'Безопасность за сохранность данных'
  }
]

const stats = [
  { label: 'Активные вагоны', value: '2,847', icon: TrainIcon },
  { label: 'Партнеры', value: '156', icon: GroupsIcon },
  { label: 'Ежедневные операции', value: '1,203', icon: TimelineIcon },
  { label: 'Доступность', value: '99.9%', icon: TrendingUpIcon }
]

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  // ✅ ваш исходный редирект оставляем
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

  useEffect(() => {
    if (session) router.push('/home')
  }, [session, router])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section (градиент как в Tailwind from-primary/5 to-accent/10) */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          py: { xs: 10, md: 14 },
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.main}0D, ${t.palette.secondary?.main || t.palette.primary.light}1A)`
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography
              variant="h2"
              sx={{ fontWeight: 800, mb: 2 }}
            >
              Railway Freight
              <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
                BI Train
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>
              Комплексная аналитическая платформа, для управления парка вагонов, управление и мониторингом.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button size="large" variant="contained" component={Link} href="/login" sx={{ px: 4, py: 1.5 }}>
                Авторизация
              </Button>
              <Button size="large" variant="outlined" component={Link} href="#features" sx={{ px: 4, py: 1.5 }}>
                Узнать больше
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
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
                        <Box sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          opacity: 0.12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
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

      {/* Features Section */}
      <Box id="features" component="section" sx={{ py: { xs: 10, md: 12 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Преимущества
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Удобный инструмент управления и мониторинга
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <Grid key={i} item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', textAlign: 'center', transition: 'box-shadow .2s', '&:hover': { boxShadow: 6 } }}>
                    <CardHeader
                      title={f.title}
                      titleTypographyProps={{ variant: 'h6' }}
                      avatar={
                        <Box sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          opacity: 0.12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 1
                        }}>
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

      {/* CTA Section */}
      <Box component="section" sx={{ py: { xs: 10, md: 12 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Готовы оптимизировать работу?
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              Присоединяйся к платформе BI Train
            </Typography>
            <Button size="large" variant="contained" color="secondary" component={Link} href="/dashboard" sx={{ px: 4, py: 1.5 }}>
              Авторизация
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
