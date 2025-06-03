// pages/index.js
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { supabase } from '../src/supabaseClient'
import { useSession, useUser } from '../src/useSession'

export default function HomePage() {
  const router = useRouter()
  const { session } = useSession()
  const user = useUser()

  useEffect(() => {
    if (session) {
      router.push('/home') // Перенаправляем внутрь после входа
    }
  }, [session])

  const handleLogin = async () => {
    const email = prompt('Email:')
    const password = prompt('Пароль:')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert('Ошибка входа: ' + error.message)
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Добро пожаловать</Typography>
      <Typography variant="body1" gutterBottom>
        Эта страница доступна всем. Чтобы попасть в систему, выполните вход:
      </Typography>
      <Button variant="contained" onClick={handleLogin}>Войти</Button>
    </Box>
  )
}
