import Link from 'next/link'
import { Box, Typography, Button } from '@mui/material'

export default function Home() {
  return (
    <Box sx={{ padding: '2rem' }}>
      <Typography variant="h4">Главная страница</Typography>
      <Box sx={{ mt: 2 }}>
        <Link href="/dislocation" passHref>
          <Button variant="contained" sx={{ mr: 2 }}>Перейти в Дислокацию</Button>
        </Link>
        <Link href="/dashboard" passHref>
          <Button variant="outlined">Перейти в Дэшборд</Button>
        </Link>
      </Box>
    </Box>
  )
}
