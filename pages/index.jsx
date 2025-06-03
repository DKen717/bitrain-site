import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Box, Typography, Button, AppBar, Toolbar, Container } from '@mui/material'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'
import { useSession, useUser } from '../src/useSession'

export default function Home() {
  const router = useRouter()
  const { session } = useSession()
  const user = useUser()

  useEffect(() => {
    if (session) {
      router.push('/home')
    }
  }, [session])

  const handleLogin = async () => {
    const email = prompt('Email:')
    const password = prompt('Пароль:')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert('Ошибка входа: ' + error.message)
  }

  return (
    <>
      {/* 🔝 Шапка */}
      <AppBar position="fixed" elevation={0} sx={{ backgroundColor: '#ffc054', color: '#000', width: '100%', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 1, }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              BI Train
            </Link>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" onClick={handleLogin} sx={{ fontWeight: 'bold', borderRadius: '999px', color: '#000' }}>
              Вход
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

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
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          О системе
        </Typography>
        <Typography>
          BI Train — это  решение для отслеживания, анализа и управления парком вагонов
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
