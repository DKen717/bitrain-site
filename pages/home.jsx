import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Typography, Button, Grid, Alert, CircularProgress } from '@mui/material'
import { supabase } from '../src/supabaseClient'
import Link from 'next/link'

export default function InternalHomePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error

        const u = data?.user
        if (!u) {
          router.replace('/')
          return
        }

        if (cancelled) return
        setUser(u)

        const { data: profileData, error: pErr } = await supabase
          .from('users_custom')
          .select('role, company_id')
          .eq('email', u.email)
          .single()

        if (pErr) throw new Error(`Профиль не найден: ${pErr.message}`)
        if (cancelled) return
        setProfile(profileData)
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || 'Ошибка авторизации')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // если сессия изменилась — реагируем
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/')
    })

    return () => {
      cancelled = true
      sub?.subscription?.unsubscribe?.()
    }
  }, [router])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (e) {
      setErrorMsg(e.message || 'Не удалось выйти')
    } finally {
      router.replace('/')
    }
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Добро пожаловать в систему
      </Typography>

      {loading && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Загружаем профиль…</Typography>
        </Box>
      )}

      {!loading && errorMsg && (
        <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>
      )}

      {!loading && profile && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Button component={Link} href="/dashboard" variant="outlined">
              📊 Дэшборд
            </Button>
          </Grid>
          <Grid item>
            <Button component={Link} href="/dislocation" variant="outlined">
              🚂 Дислокация
            </Button>
          </Grid>

          {profile.role === 'superadmin' && (
            <>
              <Grid item>
                <Button component={Link} href="/admin/users" variant="contained">
                  👥 Пользователи
                </Button>
              </Grid>
              <Grid item>
                <Button component={Link} href="/admin/companies" variant="contained">
                  🏢 Компании
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button color="error" onClick={handleLogout} disabled={loading}>
          Выйти
        </Button>
      </Box>
    </Box>
  )
}
