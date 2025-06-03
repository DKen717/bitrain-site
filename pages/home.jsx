import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Typography, Button, Grid, Paper } from '@mui/material'
import { supabase } from '../src/supabaseClient'
import Link from 'next/link'

export default function InternalHomePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)

      const { data: profileData, error } = await supabase
        .from('users_custom')
        .select('role, company_id')
        .eq('email', user.email)
        .single()

      if (!error) {
        setProfile(profileData)
      } else {
        console.error('Ошибка загрузки профиля:', error.message)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Добро пожаловать в систему</Typography>

      {profile && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Link href="/dashboard" passHref legacyBehavior>
              <Button variant="outlined">📊 Дэшборд</Button>
            </Link>
          </Grid>
          <Grid item>
            <Link href="/dislocation" passHref legacyBehavior>
              <Button variant="outlined">🚂 Дислокация</Button>
            </Link>
          </Grid>

          {profile.role === 'superadmin' && (
            <>
              <Grid item>
                <Link href="/admin/users" passHref legacyBehavior>
                  <Button variant="contained">👥 Пользователи</Button>
                </Link>
              </Grid>
              <Grid item>
                <Link href="/admin/companies" passHref legacyBehavior>
                  <Button variant="contained">🏢 Компании</Button>
                </Link>
              </Grid>
            </>
          )}
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button color="error" onClick={handleLogout}>Выйти</Button>
      </Box>
    </Box>
  )
}
