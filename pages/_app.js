// pages/_app.js
import { CssBaseline, Container } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Head from 'next/head'
import TopNav from '../components/TopNav'

const theme = createTheme({
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12
  }
})

export default function MyApp({ Component, pageProps }) {
  const user = { role: 'superadmin' } // временная заглушка

  return (
    <>
      <Head>
        <title>BI Train</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      {/* Глобальные стили прямо в _app.js */}
      <style jsx global>{`
        /* Фикс для отображения Recharts */
        svg.recharts-surface {
          overflow: visible !important;
          display: block !important;
        }
        .recharts-wrapper {
          overflow: visible !important;
        }
        .recharts-layer text {
          fill: #424242 !important;
          font-size: 12px !important;
        }
      `}</style>

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TopNav user={user} />
          <Container maxWidth="xl" sx={{ mt: 2 }}>
            <Component {...pageProps} />
          </Container>
        </LocalizationProvider>
      </ThemeProvider>
    </>
  )
}
