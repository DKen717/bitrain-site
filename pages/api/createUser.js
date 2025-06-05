// pages/api/createUser.js
import { supabaseAdmin } from '../../src/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, role, company_id } = req.body

  const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (signUpError) return res.status(400).json({ error: signUpError.message })

  const user_id = data.user.id

  const { error: insertError } = await supabaseAdmin.from('users_custom').insert([
    { user_id, email, role, company_id }
  ])

  if (insertError) return res.status(400).json({ error: insertError.message })

  res.status(200).json({ message: 'Пользователь создан' })
}
