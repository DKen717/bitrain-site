import { AppBar, Toolbar, Button } from '@mui/material'
import Link from 'next/link'

export default function TopNav() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Link href="/" passHref>
          <Button color="inherit">Главная</Button>
        </Link>
        <Link href="/dislocation" passHref>
          <Button color="inherit">Дислокация</Button>
        </Link>
        <Link href="/dashboard" passHref>
          <Button color="inherit">Дэшборд</Button>
        </Link>
      </Toolbar>
    </AppBar>
  )
}
