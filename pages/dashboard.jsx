import { Box, Typography } from '@mui/material'

export default function Dashboard() {
  return (
        <>
      <TopNav />
    <Box sx={{ padding: '2rem' }}>
      <Typography variant="h4">Дэшборд</Typography>
      <Typography>Здесь будут графики и ключевые показатели.</Typography>
    </Box>
      </>
  )
}

