// pages/api/createUser.js
import { supabaseAdmin } from '../../src/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, role, company_id } = req.body
  if (!email || !password || !role || !company_id) {
    return res.status(400).json({ error: 'Все поля обязательны' })
  }

  // 1. Проверяем: есть ли пользователь с таким email в auth.users
  const { data: existingUser, error: lookupError } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()

  let userId

  if (lookupError && lookupError.code !== 'PGRST116') {
    // PGRST116 = no rows found
    return res.status(500).json({ error: 'Ошибка при проверке существующего пользователя' })
  }

  if (existingUser) {
    // 2. Если пользователь уже есть — просто добавляем в users_custom (если ещё нет)
    userId = existingUser.id
  } else {
    // 3. Иначе создаем пользователя в Supabase Auth
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

  // 4. Проверяем: есть ли уже запись в users_custom
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
