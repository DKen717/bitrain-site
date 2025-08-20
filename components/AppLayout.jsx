// components/AppLayout.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Divider, Tooltip
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MapIcon from '@mui/icons-material/Map'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'

const drawerWidth = 260

export default function AppLayout({ children }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // { role: 'superadmin' } если есть таблица profiles

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const sess = data.session
      setSession(sess)
      if (!sess) {
        router.replace('/login')
        return
      }
      // не обязательно: тянем роль из таблицы profiles, если она есть
      try {
        const { data: rows } = await supabase.from('profiles').select('role, full_name').eq('id', sess.user.id).single()
        if (rows) setProfile(rows)
      } catch (e) {
        // таблицы может не быть — просто молча игнорируем
      }
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) router.replace('/login')
    })
    return () => sub?.subscription?.unsubscribe()
  }, [router])

  const isSuperadmin = profile?.role === 'superadmin'

  const menu = [
    { href: '/home', label: 'Главная', icon: <DashboardIcon /> },
    { href: '/dashboard', label: 'Дэшборд', icon: <DashboardIcon /> },
    { href: '/dislocation', label: 'Дислокация', icon: <MapIcon /> },
    { href: '/counterparties', label: 'Контрагенты', icon: <DashboardIcon /> },
    { href: '/my-ps', label: 'Мой ПС', icon: <DashboardIcon /> },
    { href: '/reports', label: 'Отчёты', icon: <AssessmentIcon /> },
  ]

  const adminMenu = [
    { href: '/admin/users', label: 'Пользователи', icon: <PeopleIcon /> },
    { href: '/admin/companies', label: 'Компании', icon: <BusinessIcon /> },
    { href: '/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ]

  const items = isSuperadmin ? [...menu, ...adminMenu] : menu

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/')

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ fontWeight: 800, letterSpacing: -0.3, color: 'inherit', textDecoration: 'none' }}
        >
          BI Train
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isActive(item.href)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' } }
            }}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mt: 1 }} />
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36 }}>
          {session?.user?.email?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {profile?.full_name || session?.user?.email || 'Пользователь'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {profile?.role || 'user'}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Выйти">
          <IconButton
            size="small"
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Верхняя панель внутренних страниц */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton onClick={() => setMobileOpen((v) => !v)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
            {/** можно вывести заголовок по роуту */}
            Панель управления
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Левый сайдбар */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="sidebar">
        {/* Мобильный */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
          }}
        >
          {drawer}
        </Drawer>
        {/* Десктоп */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Контент */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '72px' }}>
        {children}
      </Box>
    </Box>
  )
}
