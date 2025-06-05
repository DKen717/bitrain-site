// pages/admin/users.js
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableBody, TableCell, TableRow, Paper, IconButton
} from '@mui/material'
import { Delete, Edit, Save, LockReset } from '@mui/icons-material'
import { supabase } from '../../src/supabaseClient'
import TopNav from '../../components/TopNav'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    company_id: ''
  })
  const [editingUserId, setEditingUserId] = useState(null)
  const [editedUser, setEditedUser] = useState({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadUsers()
    loadCompanies()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users_custom').select('*').order('created_at', { ascending: false })
    if (!error && Array.isArray(data)) {
      setUsers(data)
    } else {
      console.error('❌ Ошибка загрузки пользователей:', error)
    }
  }

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('id, name')
    if (!error) {
      setCompanies(data)
    } else {
      console.error('❌ Ошибка загрузки компаний:', error)
    }
  }

  const handleAddUser = async () => {
    const { email, password, role, company_id } = newUser

    if (!email || !password || !role || !company_id) {
      alert('⚠️ Заполните все поля')
      return
    }

    const res = await fetch('/api/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, company_id })
    })

    const result = await res.json()

    if (!res.ok) {
      alert('❌ Ошибка: ' + result.error)
    } else {
      alert('✅ Пользователь создан')
      setNewUser({ email: '', password: '', role: 'user', company_id: '' })
      loadUsers()
    }
  }

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Введите новый пароль:')
    if (!newPassword) return

    const res = await fetch('/api/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, new_password: newPassword })
    })

    const result = await res.json()

    if (!res.ok) {
      alert('Ошибка при сбросе пароля: ' + result.error)
    } else {
      alert('Пароль успешно обновлён')
    }
  }

  const handleDeleteUser = async (id) => {
    const { error } = await supabase.from('users_custom').delete().eq('id', id)
    if (error) {
      console.error('❌ Ошибка удаления пользователя:', error.message)
    } else {
      loadUsers()
    }
  }

  const handleSaveEdit = async (id) => {
    const { email, role, company_id } = editedUser
    const { error } = await supabase.from('users_custom')
      .update({ email, role, company_id })
      .eq('id', id)
    if (error) {
      console.error('❌ Ошибка редактирования:', error.message)
    } else {
      setEditingUserId(null)
      setEditedUser({})
      loadUsers()
    }
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId)
    return company ? company.name : '—'
  }

  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem' }}>
        <Typography variant="h5" gutterBottom>Управление пользователями</Typography>

        {isClient && (
          <>
            <Paper sx={{ padding: 2, marginBottom: 3 }}>
              <Typography variant="subtitle1">Добавить нового пользователя</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
                <TextField
                  id="user-email"
                  name="email"
                  label="Email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
                <TextField
                  id="user-password"
                  name="password"
                  label="Пароль"
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel id="role-label">Роль</InputLabel>
                  <Select
                    labelId="role-label"
                    id="user-role"
                    name="role"
                    value={newUser.role}
                    label="Роль"
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <MenuItem value="user">Обычный</MenuItem>
                    <MenuItem value="companyadmin">Админ компании</MenuItem>
                    <MenuItem value="superadmin">Супер-админ</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel id="company-label">Компания</InputLabel>
                  <Select
                    labelId="company-label"
                    id="user-company"
                    name="company_id"
                    value={String(newUser.company_id || '')}
                    label="Компания"
                    onChange={e => setNewUser({ ...newUser, company_id: e.target.value })}
                  >
                    <MenuItem value="">—</MenuItem>
                    {companies.map(c => (
                      <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleAddUser}>➕ Добавить</Button>
              </Box>
            </Paper>

            <Typography variant="subtitle1">Список пользователей</Typography>
            <Table component={Paper}>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Компания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(users || []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {editingUserId === u.id ? (
                        <TextField
                          value={editedUser.email || ''}
                          onChange={e => setEditedUser({ ...editedUser, email: e.target.value })}
                        />
                      ) : (
                        u.email || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUserId === u.id ? (
                        <Select
                          value={editedUser.role || ''}
                          onChange={e => setEditedUser({ ...editedUser, role: e.target.value })}
                        >
                          <MenuItem value="user">Обычный</MenuItem>
                          <MenuItem value="companyadmin">Админ компании</MenuItem>
                          <MenuItem value="superadmin">Супер-админ</MenuItem>
                        </Select>
                      ) : (
                        u.role || '—'
                      )}
                    </TableCell>
                    <TableCell>{getCompanyName(u.company_id)}</TableCell>
                    <TableCell>
                      {editingUserId === u.id ? (
                        <IconButton onClick={() => handleSaveEdit(u.id)}><Save /></IconButton>
                      ) : (
                        <IconButton onClick={() => {
                          setEditingUserId(u.id)
                          setEditedUser({
                            email: u.email,
                            role: u.role,
                            company_id: u.company_id
                          })
                        }}><Edit /></IconButton>
                      )}
                      <IconButton onClick={() => handleResetPassword(u.user_id)}><LockReset /></IconButton>
                      <IconButton onClick={() => handleDeleteUser(u.id)}><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Box>
    </>
  )
}
