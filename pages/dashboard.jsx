import { Box, Typography } from '@mui/material'
import TopNav from '../components/TopNav'

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
