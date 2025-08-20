// pages/admin/users.js
import { useEffect, useState, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableBody, TableCell, TableRow, Paper, IconButton,
  Alert, CircularProgress, TableContainer, Stack
} from '@mui/material'
import { Delete, Edit, Save, LockReset } from '@mui/icons-material'
import { supabase } from '../../src/supabaseClient'
import AppLayout from '../../components/AppLayout'

const ROLE_OPTIONS = [
  { value: 'user', label: 'Обычный' },
  { value: 'company_admin', label: 'Админ компании' },
  { value: 'companyadmin', label: 'Админ компании (legacy)' }, // поддержка старого значения
  { value: 'superadmin', label: 'Супер-админ' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    company_id: ''
  })

  const [editingUserId, setEditingUserId] = useState(null)
  const [editedUser, setEditedUser] = useState({})

  const [profile, setProfile] = useState(null)
  const canManage = useMemo(() => profile?.role === 'superadmin', [profile])

  useEffect(() => {
    (async () => {
      try {
        setErrorMsg(null)
        const { data: sess } = await supabase.auth.getSession()
        const user = sess?.session?.user
        if (!user) return // AppLayout редиректит на /login

        const { data: p, error: pErr } = await supabase
          .from('users_custom')
          .select('id, role, email')
          .eq('user_id', user.id)
          .single()
        if (pErr) throw new Error(`Профиль не найден: ${pErr.message}`)
        setProfile(p)

        await Promise.all([loadUsers(), loadCompanies()])
      } catch (e) {
        setErrorMsg(e.message || 'Ошибка инициализации')
        setListLoading(false)
      }
    })()
  }, [])

  const loadUsers = async () => {
    setListLoading(true)
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка загрузки пользователей')
    } finally {
      setListLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true })
      if (error) throw error
      setCompanies(data || [])
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка загрузки компаний')
    }
  }

  const handleAddUser = async () => {
    if (!canManage) return
    const { email, password, role, company_id } = newUser
    if (!email || !password || !role || !company_id) {
      alert('⚠️ Заполните все поля')
      return
    }
    try {
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, company_id })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Ошибка создания пользователя')

      alert('✅ Пользователь создан')
      setNewUser({ email: '', password: '', role: 'user', company_id: '' })
      await loadUsers()
    } catch (e) {
      alert('❌ ' + (e.message || 'Ошибка добавления'))
    }
  }

  const handleResetPassword = async (userId) => {
    if (!canManage) return
    const newPassword = prompt('Введите новый пароль:')
    if (!newPassword) return
    try {
      const res = await fetch('/api/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: newPassword })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Ошибка при сбросе пароля')
      alert('Пароль успешно обновлён')
    } catch (e) {
      alert('❌ ' + (e.message || 'Сбой при сбросе пароля'))
    }
  }

  const handleDeleteUser = async (id) => {
    if (!canManage) return
    if (!confirm('Удалить пользователя?')) return
    try {
      const { error } = await supabase.from('users_custom').delete().eq('id', id)
      if (error) throw error
      await loadUsers()
    } catch (e) {
      alert('❌ ' + (e.message || 'Ошибка удаления'))
    }
  }

  const handleSaveEdit = async (id) => {
    if (!canManage) return
    const { email, role, company_id } = editedUser
    if (!email || !role || !company_id) {
      alert('⚠️ Заполните все поля')
      return
    }
    try {
      const { error } = await supabase
        .from('users_custom')
        .update({ email, role, company_id })
        .eq('id', id)
      if (error) throw error
      setEditingUserId(null)
      setEditedUser({})
      await loadUsers()
    } catch (e) {
      alert('❌ ' + (e.message || 'Ошибка редактирования'))
    }
  }

  const getCompanyName = (companyId) => {
    const c = companies.find((x) => String(x.id) === String(companyId))
    return c ? c.name : '—'
  }

  return (
    <AppLayout>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Пользователи</Typography>
          <Typography variant="body2" color="text.secondary">
            Управление пользователями (доступно супер-админу)
          </Typography>
        </Box>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {!canManage && profile && (
        <Alert severity="info" sx={{ mb: 2 }}>
          У вас нет прав на изменение. Просмотр доступен, действия отключены.
        </Alert>
      )}

      {/* Добавление пользователя */}
      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="subtitle1">Добавить нового пользователя</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            type="email"
          />
          <TextField
            label="Пароль"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="role-label">Роль</InputLabel>
            <Select
              labelId="role-label"
              value={newUser.role}
              label="Роль"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="company-label">Компания</InputLabel>
            <Select
              labelId="company-label"
              value={String(newUser.company_id || '')}
              label="Компания"
              onChange={(e) => setNewUser({ ...newUser, company_id: e.target.value })}
            >
              <MenuItem value="">—</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleAddUser} disabled={!canManage}>
            ➕ Добавить
          </Button>
        </Stack>
      </Paper>

      {/* Таблица пользователей */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Компания</TableCell>
              <TableCell width={220}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Загрузка…</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (users || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>Пользователей пока нет</Typography>
                </TableCell>
              </TableRow>
            ) : (
              (users || []).map((u) => {
                const roleValue = u.role === 'companyadmin' ? 'company_admin' : (u.role || '')
                const isEditing = editingUserId === u.id
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          value={editedUser.email ?? u.email ?? ''}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          size="small"
                          fullWidth
                        />
                      ) : (
                        u.email || '—'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editedUser.role ?? roleValue}
                            onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        roleValue || '—'
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={String(editedUser.company_id ?? u.company_id ?? '')}
                            onChange={(e) => setEditedUser({ ...editedUser, company_id: e.target.value })}
                          >
                            {companies.map((c) => (
                              <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        getCompanyName(u.company_id)
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <IconButton onClick={() => handleSaveEdit(u.id)} disabled={!canManage} color="primary">
                          <Save />
                        </IconButton>
                      ) : (
                        <IconButton
                          onClick={() => {
                            setEditingUserId(u.id)
                            setEditedUser({
                              email: u.email ?? '',
                              role: roleValue,
                              company_id: String(u.company_id ?? '')
                            })
                          }}
                          disabled={!canManage}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleResetPassword(u.user_id)} disabled={!canManage}>
                        <LockReset />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteUser(u.id)} disabled={!canManage} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </AppLayout>
  )
}
