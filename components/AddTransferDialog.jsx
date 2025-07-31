import { useState, useMemo, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function AddTransferDialog({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [arendatorName, setArendatorName] = useState('')
  const [transferDate, setTransferDate] = useState('')

  // Разбиваем ввод и валидируем
  const validWagons = useMemo(() => {
    return wagonList
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => /^[0-9]{8}$/.test(w))
  }, [wagonList])

  const invalidWagons = useMemo(() => {
    return wagonList
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w && !/^[0-9]{8}$/.test(w))
  }, [wagonList])

  const handleSave = async () => {
    if (!transferDate || !arendatorName || validWagons.length === 0) {
      alert('Заполните все поля и убедитесь, что номера вагонов корректны.')
      return
    }

    const user = await supabase.auth.getUser()
    const session = await supabase.auth.getSession()
    const companyId = session.data.session.user.user_metadata?.company_id

    const records = validWagons.map(wagon => ({
      wagon_number: wagon,
      name_arendator: arendatorName,
      data_peredachi: transferDate,
      company_id: companyId,
      created_by: user.data.user.id
    }))

    const { error } = await supabase.from('Arendatori').insert(records)

    if (error) {
      alert('Ошибка при добавлении: ' + error.message)
    } else {
      onClose()
      if (onSaved) onSaved()
    }
  }

    const [arendatorOptions, setArendatorOptions] = useState([])
  
    useEffect(() => {
      const fetchArendators = async () => {
        const { data, error } = await supabase
          .from('counterparties')
          .select('name_short')
          .eq('type', 'Арендатор')
          .eq('is_active', true)  // если используешь
          .order('name_short', { ascending: true })
    
        if (data) setArendatorOptions(data.map(a => a.name_short))
      }
    
      fetchArendators()
    }, [])


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить передачу вагонов</DialogTitle>
      <DialogContent>
        <TextField
          label="Номера вагонов (8 цифр, через Enter или запятую)"
          fullWidth
          multiline
          minRows={3}
          sx={{ mt: 2 }}
          value={wagonList}
          onChange={e => setWagonList(e.target.value)}
          error={invalidWagons.length > 0}
          helperText={
            invalidWagons.length > 0
              ? `Игнорируются невалидные номера: ${invalidWagons.join(', ')}`
              : ''
          }
        />

        <Typography sx={{ mt: 1, mb: 1 }}>
          Будет добавлено: <strong>{validWagons.length}</strong> вагонов
        </Typography>

        <TextField
          select
          fullWidth
          name="arendatorName"
          label="Арендатор"
          margin="dense"
          value={arendatorName}
          onChange={e => setArendatorName(e.target.value)}
        >
          {arendatorOptions.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>        
        <TextField
          label="Дата передачи"
          type="date"
          fullWidth
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          value={transferDate}
          onChange={e => setTransferDate(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  )
}
