// pages/index.js
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

// Тексты/иконки
const features = [
  {
    icon: BarChartIcon,
    title: 'Аналитика',
    description: 'Комплексные отчёты и визуализация по парку вагонов и операциям'
  },
  {
    icon: PlaceIcon,
    title: 'Онлайн-дислокация',
    description: 'Мониторинг расположения вагонов с минимальной задержкой'
  },
  {
    icon: FlashOnIcon,
    title: 'Автоматизация',
    description: 'Сценарии и процессы для ускорения ежедневной работы'
  },
  {
    icon: SecurityIcon,
    title: 'Безопасность',
    description: 'RLS, разграничение доступа и защита ваших данных'
  }
]

const stats = [
  { label: 'Активные вагоны', value: '2 847', icon: TrainIcon },
  { label: 'Партнёры', value: '156', icon: GroupsIcon },
  { label: 'Ежедневные операции', value: '1 203', icon: TimelineIcon },
  { label: 'Доступность', value: '99,9%', icon: TrendingUpIcon }
]

// full-bleed секция (ломаемся из глобального Container в _app.js)
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

  useEffect(() => {
    if (session) router.replace('/dashboard') // если у тебя пока /home — поменяй здесь обратно
  }, [session, router])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Head>
        <title>BI Train — Railway Freight Analytics</title>
        <meta name="description" content="BI Train — аналитика и мониторинг парка вагонов: дислокация, отчёты, KPI." />
      </Head>

      {/* HERO (full-bleed + мягкий градиент) */}
      <Box
        component="section"
        sx={(t) => ({
          ...fullBleedSX,
