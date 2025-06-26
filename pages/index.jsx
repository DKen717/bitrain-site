import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Box, Typography, Button, AppBar, Toolbar, Container } from '@mui/material'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      router.push('/home')
    }
  }, [session])

  return (
    <>
      {/* 💡 Hero */}
      <Box sx={{ py: 8, backgroundColor: '#ffffff' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            BI Train — Система управления вагонами
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Платформа для управления вагонами, анализом простоев и отчетностью
          </Typography>
        </Container>
      </Box>

      {/* 🌊 Волна-декор */}
      <Box sx={{ overflow: 'hidden', mt: -6 }}>
        <svg viewBox="0 0 1440 320" style={{ width: '100%', height: 'auto' }}>
          <path
            fill="#ffc054"
            fillOpacity="0.15"
            d="M0,192L60,202.7C120,213,240,235,360,240C480,245,600,235,720,208C840,181,960,139,1080,133.3C1200,128,1320,160,1380,176L1440,192L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          />
        </svg>
      </Box>

      {/* 📖 О системе */}
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center'}}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          О системе
        </Typography>
        <Typography>
          BI Train — это решение для отслеживания, анализа и управления парком вагонов
          в реальном времени. Система подключается к источникам данных, визуализирует отчеты,
          сокращает простои и автоматизирует контроль вагонов.
        </Typography>
      </Container>

      {/* 📬 Контакты */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Контакты
        </Typography>
        <Typography>📞 Телефон: </Typography>
        <Typography>✉️ Email: </Typography>
        <Typography>📍 Адрес: г.Алматы </Typography>
      </Container>
    </>
  )
}
