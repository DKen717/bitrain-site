import { AppBar, Toolbar, Typography, Button } from '@mui/material'
import Link from 'next/link'

export default function TopNav() {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#f6d46b' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff' }}>
          Aiway Logistic
        </Typography>
        <Link href="/" passHref>
          <Button sx={{ color: '#000000' }}>Главная</Button>
        </Link>
        <Link href="/dislocation" passHref>
          <Button sx={{ color: '#000000' }}>Дислокация</Button>
        </Link>
        <Link href="/dashboard" passHref>
          <Button sx={{ color: '#000000' }}>Дэшборд</Button>
        </Link>
      </Toolbar>
    </AppBar>
  )
}
