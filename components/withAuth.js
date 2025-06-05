import { useRouter } from 'next/router'
import { useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function withAuth(Component, allowedRoles = []) {
  return function ProtectedRoute(props) {
    const session = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState(null)

    useEffect(() => {
      const checkAccess = async () => {
        if (!session) {
          router.replace('/')
          return
        }

        const { data, error } = await supabase
          .from('users_custom')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (error || !data) {
          router.replace('/')
          return
        }

        setUserRole(data.role)

        if (allowedRoles.length && !allowedRoles.includes(data.role)) {
          router.replace('/unauthorized')
          return
        }

        setLoading(false)
      }

      checkAccess()
    }, [session])

    if (loading) return null
    return <Component {...props} role={userRole} />
  }
}
