import { Box, Typography, Button, AppBar, Toolbar, Container } from '@mui/material'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* 🔝 Шапка */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#f5f5f5', color: '#000' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              🚂 Логотип
            </Link>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href="/login" passHref>
              <Button variant="outlined" sx={{ borderRadius: '999px' }}>
                Вход
              </Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 💡 Hero */}
      <Box sx={{ py: 8, backgroundColor: '#ffffff' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Aiway Logistic — Система управления железнодорожной логистикой
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Единая платформа для управления вагонами, анализом простоев и отчетностью
          </Typography>
        </Container>
      </Box>

      {/* 🌊 Волна-декор */}
      <Box sx={{ overflow: 'hidden', mt: -6 }}>
        <svg viewBox="0 0 1440 320" style={{ width: '100%', height: 'auto' }}>
          <path
            fill="#6a5df5"
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
          Aiway Logistic — это облачное решение для отслеживания, анализа и управления логистикой
          в реальном времени. Система подключается к источникам данных, визуализирует отчеты,
          сокращает простои и автоматизирует контроль вагонов.
        </Typography>
      </Container>

      {/* 📬 Контакты */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Контакты
        </Typography>
        <Typography>📞 Телефон: +7 707 000 0000</Typography>
        <Typography>✉️ Email: support@aiway.kz</Typography>
        <Typography>📍 Адрес: г. Алматы, ул. Примерная, д. 123</Typography>
      </Container>
    </>
  )
}
