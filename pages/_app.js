// pages/_app.js
import { CssBaseline, Container } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Head from 'next/head'
import { useRouter } from 'next/router'
import TopNav from '../components/TopNav'

const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    primary: { main: '#2563EB' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error:   { main: '#EF4444' },
    divider: '#E5E7EB'
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 12,
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 800, letterSpacing: -0.2 },
    h3: { fontWeight: 700 }
  },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' } } },
    MuiAppBar: { styleOverrides: { root: { background: '#FFFFFF', color: '#111827', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', borderRadius: 12, fontWeight: 600, padding: '10px 16px' } }
    }
  }
})

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const isPublic = router.pathname === '/' || router.pathname === '/login'
  const user = { role: 'superadmin' } // заглушка

  return (
    <>
      <Head>
        <title>BI Train</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="BI Train — отчёты и аналитика по ж/д перевозкам: дислокация, парк, арендаторы, KPI." />
        <meta property="og:title" content="BI Train — Railway Freight Analytics" />
        <meta property="og:description" content="Визуализация данных и отчёты по вашему парку вагонов." />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      {/* Глобальные фиксы для Recharts */}
      <style jsx global>{`
        svg.recharts-surface { overflow: visible !important; display: block !important; }
        .recharts-wrapper { overflow: visible !important; }
        .recharts-layer text { fill: #424242 !important; font-size: 12px !important; }
      `}</style>

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {isPublic && <TopNav user={user} />}
          {/* На публичных — контейнер; на внутренних — отвечают страницы/лэйаут */}
          {isPublic ? (
            <Container maxWidth="xl" sx={{ mt: 2 }}>
              <Component {...pageProps} />
            </Container>
          ) : (
            <Component {...pageProps} />
          )}
        </LocalizationProvider>
      </ThemeProvider>
    </>
  )
}
