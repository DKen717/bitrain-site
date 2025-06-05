// pages/api/resetPassword.js
import { supabaseAdmin } from '../../src/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, new_password } = req.body

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    password: new_password
  })

  if (error) return res.status(400).json({ error: error.message })

  res.status(200).json({ message: 'Пароль обновлён' })
}
