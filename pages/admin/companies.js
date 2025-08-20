// pages/admin/companies.js
import { useEffect, useState } from 'react'
import {
  Box, Typography, TextField, Button, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, IconButton, Alert, CircularProgress,
  TableContainer, Stack
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../src/supabaseClient'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [newCompanyName, setNewCompanyName] = useState('')
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [editedName, setEditedName] = useState('')

  const [profile, setProfile] = useState(null)
  const canManage = profile?.role === 'superadmin'

  useEffect(() => {
    (async () => {
      try {
        setErrorMsg(null)
        // получаем сессию и профиль
        const { data: sess } = await supabase.auth.getSession()
        const user = sess?.session?.user
        if (!user) return // AppLayout сам редиректит на /login

        const { data: p, error: pErr } = await supabase
          .from('users_custom')
          .select('id, role, email')
          .eq('user_id', user.id)
          .single()
        if (pErr) throw new Error(`Профиль не найден: ${pErr.message}`)
        setProfile(p)

        await loadCompanies()
      } catch (e) {
        setErrorMsg(e.message || 'Ошибка инициализации')
      }
    })()
  }, [])

  const loadCompanies = async () => {
    setListLoading(true)
    setErrorMsg(null)
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCompanies(data || [])
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка загрузки компаний')
    } finally {
      setListLoading(false)
    }
  }

  const handleAddCompany = async () => {
    if (!canManage) return
    const name = newCompanyName.trim()
    if (!name) return
    try {
      const { error } = await supabase
        .from('companies')
        .insert([{ name }]) // created_at пусть ставит БД (DEFAULT now())
      if (error) throw error
      setNewCompanyName('')
      await loadCompanies()
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка добавления компании')
    }
  }

  const handleEdit = (company) => {
    setEditingCompanyId(company.id)
    setEditedName(company.name)
  }

  const handleSaveEdit = async (id) => {
    if (!canManage) return
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: editedName })
        .eq('id', id)
      if (error) throw error
      setEditingCompanyId(null)
      setEditedName('')
      await loadCompanies()
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка обновления компании')
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Удалить компанию? Это действие необратимо.')) return
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id)
      if (error) throw error
      await loadCompanies()
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка удаления компании')
    }
  }

  return (
    <AppLayout>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Компании</Typography>
          <Typography variant="body2" color="text.secondary">
            Управление списком компаний (доступно супер-админу)
          </Typography>
        </Box>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {!canManage && profile && (
        <Alert severity="info" sx={{ mb: 2 }}>
          У вас нет прав на изменение. Просмотр доступен, действия отключены.
        </Alert>
      )}

      {/* Добавление компании */}
      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="subtitle1">Добавить новую компанию</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Название компании"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleAddCompany} disabled={!canManage}>
            ➕ Добавить
          </Button>
        </Stack>
      </Paper>

      {/* Таблица компаний */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Загрузка…</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    Пока нет компаний
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>{company.id}</TableCell>

                  <TableCell>
                    {editingCompanyId === company.id ? (
                      <TextField
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    ) : (
                      company.name
                    )}
                  </TableCell>

                  <TableCell>
                    {company.created_at
                      ? new Date(company.created_at).toLocaleString()
                      : '—'}
                  </TableCell>

                  <TableCell align="right">
                    {editingCompanyId === company.id ? (
                      <IconButton onClick={() => handleSaveEdit(company.id)} color="primary" disabled={!canManage}>
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleEdit(company)} color="primary" disabled={!canManage}>
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDelete(company.id)} color="error" disabled={!canManage}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </AppLayout>
  )
}
