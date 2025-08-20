// components/TopNav.jsx
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../src/supabaseClient'

export default function TopNav({ user }) {
  const router = useRouter()
  const pathname = router.pathname
  const isPublic = pathname === '/' || pathname === '/login'

  const baseItems = [
    { href: '/home', label: 'Главная' },
    { href: '/dislocation', label: 'Дислокация' },
    { href: '/dashboard', label: 'Дэшборд' },
    { href: '/reports', label: 'Отчёты' },
  ]

  const adminItems = [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/companies', label: 'Компании' },
  ]

  const items = user?.role === 'superadmin' ? [...baseItems, ...adminItems] : baseItems

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ minHeight: 72 }}>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: isPublic ? 1 : 0,
            fontWeight: 800,
            letterSpacing: -0.3,
            color: 'inherit',
            textDecoration: 'none',
            mr: 2
          }}
        >
          BI Train
        </Typography>

        {/* Нав-линки показываем только на внутренних страницах */}
        {!isPublic && (
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, flexWrap: 'wrap' }}>
            {items.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                color={isActive(item.href) ? 'primary' : 'inherit'}
                variant={isActive(item.href) ? 'contained' : 'text'}
                sx={{ borderRadius: 10 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Правая часть: Вход на публичных, Выход на внутренних */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isPublic ? (
            pathname === '/login' ? null : (
              <Button variant="contained" color="primary" component={Link} href="/login">
                Вход
              </Button>
            )
          ) : (
            <Button onClick={handleLogout}>Выйти</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
