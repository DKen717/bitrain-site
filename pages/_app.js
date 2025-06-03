// pages/_app.js
import { CssBaseline } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Head from 'next/head'

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
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
