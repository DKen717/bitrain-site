import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Box, MenuItem
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState([])
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

  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', user.id)
        .single()
      console.log(data, error)
      setUserProfile(profile)
      loadCounterparties()
    }
  }

  
  const loadCounterparties = async () => {
    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCounterparties(data)
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }


  const handleSubmit = async () => {
    if (!userProfile) return

    const payload = {
      ...formData,
      company_id: userProfile.company_id,
      created_by: userProfile.id
    }

    let error
    if (isEdit) {
      ({ error } = await supabase
        .from('counterparties')
        .update(payload)
        .eq('id', editingId))
    } else {
      ({ error } = await supabase
        .from('counterparties')
        .insert([payload]))
    }

    if (!error) {
      handleClose()
      loadCounterparties()
    } else {
      alert('Ошибка: ' + error.message)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setFormData({
      name_full: '',
      name_short: '',
      type: '',
      iin_bin: '',
      contact_name: '',
      contact_phone: '',
      email: ''
    })
    setIsEdit(false)
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    const { error } = await supabase
      .from('counterparties')
      .delete()
      .eq('id', confirmDeleteId)
    if (!error) {
      setConfirmDeleteId(null)
      loadCounterparties()
    }
  }

  const handleToggleActive = async (id, currentValue) => {
    await supabase
      .from('counterparties')
      .update({ is_active: !currentValue })
      .eq('id', id)
    loadCounterparties()
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Контрагенты</Typography>

      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Добавить контрагента
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Краткое название</TableCell>
            <TableCell>Полное название</TableCell>
            <TableCell>Тип</TableCell>
            <TableCell>ИИН/БИН</TableCell>
            <TableCell>Контактное лицо</TableCell>
            <TableCell>Телефон</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Активен</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {counterparties.map(row => (
            <TableRow key={row.id}>
              <TableCell>{row.name_short}</TableCell>
              <TableCell>{row.name_full}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.iin_bin}</TableCell>
              <TableCell>{row.contact_name}</TableCell>
              <TableCell>{row.contact_phone}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={() => handleToggleActive(row.id, row.is_active)}
                />
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() => {
                    setFormData(row)
                    setEditingId(row.id)
                    setIsEdit(true)
                    setOpen(true)
                  }}
                >
                  Редактировать
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setConfirmDeleteId(row.id)}
                >
                  Удалить
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Диалог добавления / редактирования */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEdit ? 'Редактировать' : 'Добавить'} контрагента</DialogTitle>
        <DialogContent>
          <TextField fullWidth name="name_short" label="Краткое название" margin="dense" value={formData.name_short} onChange={handleChange} />
          <TextField fullWidth name="name_full" label="Полное название" margin="dense" value={formData.name_full} onChange={handleChange} />
          <TextField select fullWidth name="type" label="Тип" margin="dense" value={formData.type} onChange={handleChange}>
            {['клиент', 'партнер', 'поставщик', 'перевозчик'].map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth name="iin_bin" label="ИИН / БИН" margin="dense" value={formData.iin_bin} onChange={handleChange} />
          <TextField fullWidth name="contact_name" label="Контактное лицо" margin="dense" value={formData.contact_name} onChange={handleChange} />
          <TextField fullWidth name="contact_phone" label="Телефон" margin="dense" value={formData.contact_phone} onChange={handleChange} />
          <TextField fullWidth name="email" label="Email" margin="dense" value={formData.email} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={Boolean(confirmDeleteId)} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Удалить контрагента?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Отмена</Button>
          <Button color="error" onClick={handleDelete}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
