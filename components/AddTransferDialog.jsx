import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function AddTransferDialog({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [arendatorName, setArendatorName] = useState('')
  const [transferDate, setTransferDate] = useState('')

const handleSave = async () => {
  const user = await supabase.auth.getUser()
  const session = await supabase.auth.getSession()
  const companyId = session.data.session.user.user_metadata?.company_id

  // Разбиваем по строкам или запятым
  const wagons = wagonList
    .split(/[\n,]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0)

  // Подготовка массива объектов
  const records = wagons.map(wagon => ({
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


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить передачу вагона</DialogTitle>
      <DialogContent>
        <TextField
          label="Номера вагонов (через Enter или запятую)"
          fullWidth
          multiline
          minRows={3}
          sx={{ mt: 2 }}
          value={wagonList}
          onChange={e => setWagonList(e.target.value)}
        />
        <TextField
          label="Арендатор"
          fullWidth
          sx={{ mt: 2 }}
          value={arendatorName}
          onChange={e => setArendatorName(e.target.value)}
        />
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
