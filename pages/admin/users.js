// pages/admin/users.js
import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableHead, TableBody, TableCell, TableRow, Paper
} from '@mui/material'
import { supabase } from '../../src/supabaseClient'
import TopNav from '../../components/TopNav'
import dayjs from 'dayjs'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', company_id: '' })

  useEffect(() => {
    loadUsers()
    loadCompanies()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users_custom').select('*')
    if (!error) {
      console.log('✅ Users loaded:', data)
      setUsers(data)
    } else {
      console.error('❌ Ошибка загрузки пользователей:', error)
    }
    if (!error && Array.isArray(data)) {
      setUsers(data)
    } else {
      console.error('Ошибка или не массив:', error, data)
    }    
  }

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('id, name')
    if (!error) {
      console.log('✅ Companies loaded:', data)
      setCompanies(data)
    } else {
      console.error('❌ Ошибка загрузки компаний:', error)
    }
  }


  const getCompanyName = (companyId) => {
  const company = companies.find(c => c.id === companyId)
  if (!company) {
    console.warn('⚠️ Компания не найдена по ID:', companyId)
    return '-'
  }
  return company ? company.name : '—'
}


  const handleAddUser = async () => {
    const { email, password, role, company_id } = newUser

    if (!email || !password || !role || !company_id) {
      alert('⚠️ Заполните все поля')
      return
    }

    const { error } = await supabase.from('users_custom').insert([
      { email, password, role, company_id }
    ])

    if (error) {
      console.error('❌ Ошибка добавления пользователя:', error.message)
      alert('Ошибка добавления пользователя: ' + error.message)
    } else {
      setNewUser({ email: '', password: '', role: 'user', company_id: '' })
      loadUsers()
    }
  }

  console.log('👤 Users:', users)

  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem' }}>
        <Typography variant="h5" gutterBottom>Управление пользователями</Typography>

        {/* 📥 Добавление пользователя */}
        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="subtitle1">Добавить нового пользователя</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
            <TextField label="Email" value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <TextField label="Пароль" type="password" value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Роль</InputLabel>
              <Select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                label="Роль"
              >
                <MenuItem value="user">Обычный</MenuItem>
                <MenuItem value="companyadmin">Админ компании</MenuItem>
                <MenuItem value="superadmin">Супер-админ</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Компания</InputLabel>
              <Select
                value={newUser.company_id}
                onChange={e => setNewUser({ ...newUser, company_id: e.target.value })}
                label="Компания"
              >
                <MenuItem value="">—</MenuItem>
                {companies.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleAddUser}>➕ Добавить</Button>
          </Box>
        </Paper>

        {/* 📋 Список пользователей */}
        <Typography variant="subtitle1">Список пользователей</Typography>
        <Table component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Компания</TableCell>
              <TableCell>Дата создания</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users || []).map((u, i) => (
              <TableRow key={u.id || i}>
                <TableCell>{u.email || '—'}</TableCell>
                <TableCell>{u.role || '—'}</TableCell>
                <TableCell>{getCompanyName(u.company_id)}</TableCell>
                <TableCell>
                  {u.created_at
                    ? dayjs(u.created_at).format('YYYY-MM-DD HH:mm')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  )
}
