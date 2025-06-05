// pages/dashboard.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession, useUser } from '@supabase/auth-helpers-react'
import { supabase } from '../src/supabaseClient'
import { Box, Typography, CircularProgress } from '@mui/material'

export default function DashboardPage() {
  const router = useRouter()
  const session = useSession()
  const user = useUser()
  const [companyId, setCompanyId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/')
    }
  }, [session])

  useEffect(() => {
    const loadUserCompany = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('users_custom')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          setCompanyId(data.company_id)
        } else {
          console.error('Ошибка получения компании пользователя:', error)
        }
        setLoading(false)
      }
    }
    loadUserCompany()
  }, [user])

  if (!session || loading) return <CircularProgress />

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4">Добро пожаловать в Дэшборд</Typography>
      <Typography>Вы вошли как пользователь компании #{companyId}</Typography>
      {/* здесь можно отобразить отчеты и данные, фильтрованные по companyId */}
    </Box>
  )
}
