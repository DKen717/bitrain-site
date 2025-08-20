// components/AppLayout.jsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Tooltip, IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MapIcon from '@mui/icons-material/Map'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import TrainIcon from '@mui/icons-material/Train'
import ContactsIcon from '@mui/icons-material/Contacts'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { supabase } from '../src/supabaseClient'

const drawerWidth = 260
const collapsedWidth = 72
const STORAGE_KEY = 'bt_sidebar_collapsed'

export default function AppLayout({ children, withTopBar = false, collapsedDefault = false }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [fullName, setFullName] = useState(null)
  const [email, setEmail] = useState(null)
  const [collapsed, setCollapsed] = useState(collapsedDefault)

  // --- restore collapsed from localStorage (client-only) ---
  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (v === '1' || v === '0') setCollapsed(v === '1')
      else setCollapsed(Boolean(collapsedDefault))
    } catch {
      setCollapsed(Boolean(collapsedDefault))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // один раз при монтировании

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }

  // ---- auth + роль ----
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const sess = data?.session
      setSession(sess)
      if (!sess) { router.replace('/login'); return }

      const u = sess.user
      setEmail(u.email || '')

      let roleVal = null
      let nameVal = null

      try {
        const { data: uc } = await supabase
          .from('users_custom')
          .select('role, full_name')
          .eq('user_id', u.id)
          .single()
        if (uc) { roleVal = uc.role; nameVal = uc.full_name || null }
      } catch {}

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
    { href: '/home', label: 'Главная', icon: <DashboardIcon /> },
    { href: '/dashboard', label: 'Дэшборд', icon: <DashboardIcon /> },
    { href: '/dislocation', label: 'Дислокация', icon: <MapIcon /> },
    { href: '/counterparties', label: 'Контрагенты', icon: <ContactsIcon /> },
    { href: '/my-ps', label: 'Мой ПС', icon: <TrainIcon /> },
  ]
  const adminMenu = [
    { href: '/admin/users', label: 'Пользователи', icon: <PeopleIcon /> },
    { href: '/admin/companies', label: 'Компании', icon: <BusinessIcon /> },
    { href: '/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ]
  const items = isSuperadmin ? [...baseMenu, ...adminMenu] : baseMenu

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/')

  const renderItem = (item) => {
    const Btn = (
      <ListItemButton
        key={item.href}
        component={Link}
        href={item.href}
        selected={isActive(item.href)}
        sx={{
          borderRadius: 2, mb: 0.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1.25 : 1.5,
          '&.Mui-selected': {
            bgcolor: 'primary.main', color: 'primary.contrastText',
            '& .MuiListItemIcon-root': { color: 'primary.contrastText' }
          }
        }}
        onClick={() => setMobileOpen(false)}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: 'center' }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && <ListItemText primary={item.label} />}
      </ListItemButton>
    )
    return collapsed
      ? <Tooltip key={item.href} title={item.label} placement="right" arrow>{Btn}</Tooltip>
      : Btn
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header: логотип + кнопка свёртки (без инфо о пользователе) */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: collapsed ? 'center' : 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            fontWeight: 800, letterSpacing: -0.3, color: 'inherit', textDecoration: 'none',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
          }}
        >
          {collapsed ? 'BI' : 'BI Train'}
        </Typography>
        <IconButton size="small" onClick={toggleCollapsed} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {items.map(renderItem)}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mt: 1 }} />

      {/* Нижняя панель: аватар + выход. Текст скрыт в mini-режиме */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36 }}>
          {(email || 'U')[0].toUpperCase()}
        </Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            {/* Информацию о пользователе под логотипом убрали, здесь оставили короткую подпись */}
            <Typography variant="body2" noWrap>{fullName || email || 'Пользователь'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{role || 'user'}</Typography>
          </Box>
        )}
        <Box sx={{ flexGrow: 1, display: collapsed ? 'none' : 'block' }} />
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
      {/* плавающий гамбургер для мобилки */}
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
      <Box
        component="nav"
        sx={{
          width: { md: collapsed ? collapsedWidth : drawerWidth },
          flexShrink: { md: 0 }
        }}
        aria-label="sidebar"
      >
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
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedWidth : drawerWidth,
              boxSizing: 'border-box'
            }
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
