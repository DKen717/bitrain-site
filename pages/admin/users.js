// pages/admin/users.js
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableBody, TableCell, TableRow, Paper
} from '@mui/material'
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

  useEffect(() => {
    loadUsers()
    loadCompanies()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users_custom').select('*')
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

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId)
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

  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem' }}>
        <Typography variant="h5" gutterBottom>Управление пользователями</Typography>

        {/* 📥 Добавление пользователя */}
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


        {/* 📋 Список пользователей */}
        <Typography variant="subtitle1">Список пользователей</Typography>
        <Table component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Компания</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users || []).map((u, i) => (
              <TableRow key={u.id}>
                <TableCell>{u.email || '—'}</TableCell>
                <TableCell>{u.role || '—'}</TableCell>
                <TableCell>{getCompanyName(u.company_id)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  )
}
