// components/AppLayout.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Tooltip, IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MapIcon from '@mui/icons-material/Map'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import TrainIcon from '@mui/icons-material/Train'
import ContactsIcon from '@mui/icons-material/Contacts'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'

const drawerWidth = 260

export default function AppLayout({ children, withTopBar = false }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [fullName, setFullName] = useState(null)
  const [email, setEmail] = useState(null)

  // ---- auth + роль (users_custom с фоллбэком к profiles) ----
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const sess = data?.session
      setSession(sess)
      if (!sess) { router.replace('/login'); return }

      const u = sess.user
      setEmail(u.email || '')
      // 1) users_custom по user_id (основной путь)
      let roleVal = null, nameVal = null
      try {
        const { data: uc } = await supabase
          .from('users_custom')
          .select('role, full_name')
          .eq('user_id', u.id)
          .single()
        if (uc) { roleVal = uc.role; nameVal = uc.full_name || null }
      } catch {}

      // 2) если нет — users_custom по email
      if (!roleVal) {
        try {
          const { data: uc2 } = await supabase
            .from('users_custom')
            .select('role, full_name')
            .eq('email', u.email)
            .single()
          if (uc2) { roleVal = uc2.role; nameVal = nameVal || uc2.full_name || null }
        } catch {}
      }

      // 3) если всё ещё нет — profiles по user.id (на случай другой схемы)
      if (!roleVal) {
        try {
          const { data: p } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', u.id)
            .single()
          if (p) { roleVal = p.role; nameVal = nameVal || p.full_name || null }
        } catch {}
      }

      // нормализация роли
      const normalizeRole = (r) => (r === 'companyadmin' ? 'company_admin' : r)
      setRole(normalizeRole(roleVal || 'user'))
      setFullName(nameVal)
    }

    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) router.replace('/login')
    })
    return () => sub?.subscription?.unsubscribe()
  }, [router])

  const isSuperadmin = role === 'superadmin'

  const baseMenu = [
    { href: '/dashboard', label: 'Дэшборд', icon: <DashboardIcon /> },
    { href: '/dislocation', label: 'Дислокация', icon: <MapIcon /> },
    { href: '/reports', label: 'Отчёты', icon: <AssessmentIcon /> },
    { href: '/my-ps', label: 'Мой ПС', icon: <TrainIcon /> },
    { href: '/counterparties', label: 'Контрагенты', icon: <ContactsIcon /> },
  ]
  const adminMenu = [
    { href: '/admin/users', label: 'Пользователи', icon: <PeopleIcon /> },
    { href: '/admin/companies', label: 'Компании', icon: <BusinessIcon /> },
    { href: '/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ]
  const items = isSuperadmin ? [...baseMenu, ...adminMenu] : baseMenu

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
        <Typography variant="caption" color="text.secondary">
          {fullName || email || 'Пользователь'}{role ? ` · ${role}` : ''}
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
              borderRadius: 2, mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main', color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' }
              }
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
          {(email || 'U')[0].toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>{fullName || email || 'Пользователь'}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{role || 'user'}</Typography>
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
      {/* плавающая кнопка-гамбургер для мобилки (вместо верхней панели) */}
      {!withTopBar && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 12, left: 12,
            display: { xs: 'inline-flex', md: 'none' },
            zIndex: (t) => t.zIndex.drawer + 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 1
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

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
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  )
}
