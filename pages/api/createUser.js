// pages/api/createUser.js
import { supabaseAdmin } from '../../src/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, role, company_id } = req.body
  if (!email || !password || !role || !company_id) {
    return res.status(400).json({ error: 'Все поля обязательны' })
  }

  // 🔍 Получаем список пользователей из Auth
  const { data: existingUsers, error: lookupError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  })

  if (lookupError) {
    return res.status(500).json({ error: 'Ошибка при получении списка пользователей' })
  }

  const existingUser = existingUsers.users.find(u => u.email === email)

  let userId

  if (existingUser) {
    userId = existingUser.id
  } else {
    // 🆕 Создаем пользователя в Supabase Auth
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      return res.status(400).json({ error: createError.message })
    }

    userId = data.user.id
  }

  // 🗃 Проверяем: есть ли уже запись в users_custom
  const { data: userMeta } = await supabaseAdmin
    .from('users_custom')
    .select('id')
    .eq('email', email)
    .single()

  if (!userMeta) {
    const { error: insertError } = await supabaseAdmin.from('users_custom').insert([
      { user_id: userId, email, role, company_id, created_at: new Date().toISOString() }
    ])

    if (insertError) {
      return res.status(400).json({ error: insertError.message })
    }
  }

  return res.status(200).json({ message: 'Пользователь добавлен и синхронизирован' })
}
