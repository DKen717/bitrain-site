// pages/admin/users.js
import { useEffect, useState } from 'react'
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableHead, TableBody, TableCell, TableRow, Paper
} from '@mui/material'
import { supabase } from '../../src/supabaseClient'
import TopNav from '../../components/TopNav'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', company_id: '' })

  useEffect(() => {
    loadUsers()
    loadCompanies()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*')
    if (!error) setUsers(data)
  }

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('id, name')
    if (!error) setCompanies(data)
  }

  const handleAddUser = async () => {
    // ⚠️ Тут должен быть хеш пароля через API, временно сохраняем как текст
    const { error } = await supabase.from('users').insert([newUser])
    if (!error) {
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
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{getCompanyName(u.company_id)}</TableCell>
                <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  )
}
