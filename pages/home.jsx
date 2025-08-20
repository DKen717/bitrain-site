// pages/internal-home.jsx
import { useEffect, useState } from 'react'
import { Box, Typography, Button, Grid, Alert, CircularProgress, Card, CardContent } from '@mui/material'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'
import AppLayout from '../components/AppLayout'

export default function InternalHomePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // AppLayout уже перекинет на /login, если сессии нет
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const u = data?.session?.user
        if (!u) return

        // Берём роль/компанию из вашей таблицы users_custom (по email)
        const { data: profileData, error: pErr } = await supabase
          .from('users_custom')
          .select('role, company_id, full_name')
          .eq('email', u.email)
          .single()

        if (pErr) throw new Error(`Профиль не найден: ${pErr.message}`)
        if (!cancelled) setProfile(profileData)
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || 'Ошибка авторизации')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch {}
  }

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Добро пожаловать{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {profile ? `Роль: ${profile.role}${profile.company_id ? ` · Компания ID: ${profile.company_id}` : ''}` : 'Загружаем профиль…'}
      </Typography>

      {loading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Загружаем профиль…</Typography>
        </Box>
      )}

      {!loading && errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}

      {!loading && !errorMsg && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Перейти</Typography>
                <Button fullWidth component={Link} href="/dashboard" variant="contained" sx={{ mt: 1 }}>
                  📊 Дэшборд
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Перейти</Typography>
                <Button fullWidth component={Link} href="/dislocation" variant="contained" sx={{ mt: 1 }}>
                  🚂 Дислокация
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {profile?.role === 'superadmin' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Администрирование</Typography>
                    <Button fullWidth component={Link} href="/admin/users" variant="outlined" sx={{ mt: 1 }}>
                      👥 Пользователи
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Администрирование</Typography>
                    <Button fullWidth component={Link} href="/admin/companies" variant="outlined" sx={{ mt: 1 }}>
                      🏢 Компании
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button color="error" onClick={handleLogout} disabled={loading}>
          Выйти
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          (Иконка выхода есть и в сайдбаре)
        </Typography>
      </Box>
    </AppLayout>
  )
}
