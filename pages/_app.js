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
  return (
    <>
      <Head>
        <title>BI Train</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* глобальная шапка */}
        <TopNav />
        
        {/* DatePicker Provider + Container */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Container maxWidth="xl" sx={{ mt: 2 }}>
            <Component {...pageProps} />
          </Container>
        </LocalizationProvider>
      </ThemeProvider>
    </>
  )
}
