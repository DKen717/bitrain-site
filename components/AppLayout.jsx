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
  useEffect(() =>
