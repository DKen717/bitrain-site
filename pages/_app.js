// pages/_app.js
import '../styles/bi-palette.css' // ⬅️ палитра (CSS-переменные)
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
    background: { default: 'hsl(var(--background))', paper: 'hsl(var(--card))' },
    text: { primary: 'hsl(var(--foreground))', secondary: 'hsl(var(--muted-foreground))' },
    primary: { main: 'hsl(var(--primary))', contrastText: 'hsl(var(--primary-foreground))' },
    secondary: { main: 'hsl(var(--secondary))', contrastText: 'hsl(var(--secondary-foreground))' },
    success: { main: 'hsl(var(--success))' },
    warning: { main: 'hsl(var(--warning))' },
    error:   { main: 'hsl(var(--destructive))' },
    divider: 'hsl(var(--border))'
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 12,
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 800, letterSpacing: -0.2 },
    h3: { fontWeight: 700 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 12, fontWeight: 600, padding: '10px 16px' },
        containedPrimary: {
          backgroundColor: 'hsl(var(--primary))',
          '&:hover': { backgroundColor: 'hsl(var(--primary-hover))' }
        }
      },
      // Глобальный пресет для «белых» кнопок с видимой рамкой:
      // Используй на компоненте: variant="contained" color="inherit"
      variants: [
        {
          props: { variant: 'contained', color: 'inherit' },
          style: {
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
            '&:hover': {
              backgroundColor: 'hsl(var(--secondary))',
              boxShadow: 'inset 0 0 0 1px hsl(var(--border))'
            }
          }
        }
      ]
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'hsl(var(--sidebar-background))',
          color: 'hsl(var(--sidebar-foreground))',
          borderRight: '1px solid hsl(var(--sidebar-border))'
        }
      }
    },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: 'hsl(var(--table-header))' } } },
    MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: 'hsl(var(--table-hover))' } } } }
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
        .recharts-layer text { fill: hsl(var(--foreground)) !important; font-size: 12px !important; }
      `}</style>

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {isPublic && <TopNav user={user} />}
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
