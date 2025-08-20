// pages/counterparties.js
import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Box, MenuItem, Switch, Alert,
  TableContainer, Paper, CircularProgress, Stack
} from '@mui/material'
import { supabase } from '../src/supabaseClient'
import AppLayout from '../components/AppLayout'

const TYPE_OPTIONS = ['Арендатор', 'Собственник']

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name_full: '',
    name_short: '',
    type: '',
    iin_bin: '',
    contact_name: '',
    contact_phone: '',
    email: ''
  })
  const [isEdit, setIsEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const [userProfile, setUserProfile] = useState(null)
  const canManage =
    userProfile?.role === 'superadmin' || userProfile?.role === 'company_admin'

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    setErrorMsg(null)
    try {
      const { data: sess } = await supabase.auth.getSession()
      const user = sess?.session?.user
      if (!user) return // AppLayout сам перекинет на /login

      const { data: profile, error: pErr } = await supabase
        .from('users_custom')
        .select('id, role, company_id, email')
        .eq('user_id', user.id)
        .single()

      if (pErr) throw new Error(`Профиль не найден: ${pErr.message}`)
      setUserProfile(profile)

      await loadCounterparties(profile.company_id)
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка загрузки профиля/данных')
    }
  }

  const loadCounterparties = async (companyId) => {
    setListLoading(true)
    setErrorMsg(null)
    try {
      let q = supabase
        .from('counterparties')
        .select('*')
        .order('created_at', { ascending: false })
      if (companyId) q = q.eq('company_id', companyId)

      const { data, error } = await q
      if (error) throw error
      setCounterparties(data || [])
    } catch (e) {
      setErrorMsg(e.message || 'Ошибка загрузки контрагентов')
    } finally {
      setListLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const pickPayload = (src) => {
    const {
      name_full, name_short, type, iin_bin, contact_name, contact_phone, email
    } = src
    return { name_full, name_short, type, iin_bin, contact_name, contact_phone, email }
  }

  const handleSubmit = async () => {
    if (!userProfile) return
    if (!formData.name_short?.trim()) return alert('Укажите краткое название')
    if (!formData.type) return alert('Выберите тип')

    const payload = {
      ...pickPayload(formData),
      company_id: userProfile.company_id,
      created_by: userProfile.id
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('counterparties')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('counterparties')
          .insert([payload])
        if (error) throw error
      }
      handleClose()
      await loadCounterparties(userProfile.company_id)
    } catch (e) {
      alert('Ошибка: ' + (e.message || 'неизвестная'))
    }
  }

  const handleOpenCreate = () => {
    setIsEdit(false)
    setEditingId(null)
    setFormData({
      name_full: '',
      name_short: '',
      type: '',
      iin_bin: '',
      contact_name: '',
      contact_phone: '',
      email: ''
    })
    setOpen(true)
  }

  const handleOpenEdit = (row) => {
    setIsEdit(true)
    setEditingId(row.id)
    setFormData(pickPayload(row))
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setIsEdit(false)
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    try {
      const { error } = await supabase
        .from('counterparties')
        .delete()
        .eq('id', confirmDeleteId)
      if (error) throw error
      setConfirmDeleteId(null)
      await loadCounterparties(userProfile.company_id)
    } catch (e) {
      alert('Ошибка удаления: ' + (e.message || 'неизвестная'))
    }
  }

  const handleToggleActive = async (id, currentValue) => {
    try {
      setCounterparties((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !currentValue } : r))
      )
      const { error } = await supabase
        .from('counterparties')
        .update({ is_active: !currentValue })
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      setCounterparties((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: currentValue } : r))
      )
      alert('Ошибка переключения: ' + (e.message || 'неизвестная'))
    }
  }

  return (
    <AppLayout>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Контрагенты</Typography>
          <Typography variant="body2" color="text.secondary">
            Просмотр и управление контрагентами вашей компании
          </Typography>
        </Box>
        {canManage && (
          <Button variant="contained" onClick={handleOpenCreate}>
            Добавить контрагента
          </Button>
        )}
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Краткое название</TableCell>
              <TableCell>Полное название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>ИИН/БИН</TableCell>
              <TableCell>Контакт</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Активен</TableCell>
              {canManage && <TableCell>Действия</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 8}>
                  <Box sx={{ py: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Загрузка…</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : counterparties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 8}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    Нет данных
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              counterparties.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name_short}</TableCell>
                  <TableCell>{row.name_full}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.iin_bin}</TableCell>
                  <TableCell>{row.contact_name}</TableCell>
                  <TableCell>{row.contact_phone}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!row.is_active}
                      onChange={() => canManage && handleToggleActive(row.id, row.is_active)}
                      disabled={!canManage}
                      size="small"
                    />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => handleOpenEdit(row)}>
                          Редактировать
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setConfirmDeleteId(row.id)}
                        >
                          Удалить
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог добавления / редактирования */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEdit ? 'Редактировать' : 'Добавить'} контрагента</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth name="name_short" label="Краткое название" margin="dense"
            value={formData.name_short} onChange={handleChange} required
          />
          <TextField
            fullWidth name="name_full" label="Полное название" margin="dense"
            value={formData.name_full} onChange={handleChange}
          />
          <TextField
            select fullWidth name="type" label="Тип" margin="dense"
            value={formData.type} onChange={handleChange} required
          >
            {TYPE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth name="iin_bin" label="ИИН / БИН" margin="dense"
            value={formData.iin_bin} onChange={handleChange} inputProps={{ maxLength: 12 }}
          />
          <TextField
            fullWidth name="contact_name" label="Контактное лицо" margin="dense"
            value={formData.contact_name} onChange={handleChange}
          />
          <TextField
            fullWidth name="contact_phone" label="Телефон" margin="dense"
            value={formData.contact_phone} onChange={handleChange}
          />
          <TextField
            fullWidth name="email" label="Email" type="email" margin="dense"
            value={formData.email} onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canManage}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={Boolean(confirmDeleteId)} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Удалить контрагента?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Отмена</Button>
          <Button color="error" onClick={handleDelete} disabled={!canManage}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
