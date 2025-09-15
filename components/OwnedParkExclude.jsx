// components/OwnedParkExclude.jsx
import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function OwnedParkExclude({ open, onClose, companyId, onSaved }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const parseNumbers = (txt) =>
    txt.split(/[\s,;\n\r]+/).map(s => s.trim()).filter(Boolean)

  const handleExclude = async () => {
    const nums = parseNumbers(value)
    if (!nums.length) { alert('Укажи хотя бы один номер вагона'); return }
    if (!companyId) { alert('Не найден companyId'); return }

    if (!window.confirm(`Исключить ${nums.length} вагон(ов) из активных?`)) return

    setBusy(true)
    try {
      const { error } = await supabase
        .from('my_wagons')
        .update({ is_active: false })
        .eq('owner_company_id', companyId)
        .eq('is_owned', true)
        .in('wagon_number', nums)

      if (error) throw error
      setValue('')
      onSaved?.()
    } catch (e) {
      console.error(e)
      alert('Ошибка исключения: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Исключить вагоны</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Введите номера вагонов через запятую, пробел или с новой строки.
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder="12345, 23456, 34567"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button variant="contained" color="warning" onClick={handleExclude} disabled={busy}>
          Исключить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
