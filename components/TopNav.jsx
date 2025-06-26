import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function TopNav({ user }) {
  const router = useRouter()
  const isIndexPage = router.pathname === '/'
  const isLoginPage = router.pathname === '/login' // 🔹 Добавлено

  return (
    <AppBar position="static">
      <Toolbar>
      <Typography 
        variant="h6" 
        sx={{ flexGrow: 1, cursor: 'pointer', textDecoration: 'none' }} 
        component={Link} 
        href="/"
      >
        BI Train
      </Typography>

        {/* 🔽 Навигация скрывается на /login */}
        {!isLoginPage && (
          <Box>
            {isIndexPage ? (
              <Button color="inherit" component={Link} href="/login">Вход</Button>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/">Главная</Button>
                <Button color="inherit" component={Link} href="/dislocation">Дислокация</Button>
                <Button color="inherit" component={Link} href="/dashboard">Дэшборд</Button>

                {user?.role === 'superadmin' && (
                  <>
                    <Button color="inherit" component={Link} href="/admin/users">Пользователи</Button>
                    <Button color="inherit" component={Link} href="/admin/companies">Компании</Button>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
