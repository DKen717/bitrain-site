// components/ParkEditDialog.jsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'
import { useState } from 'react'

export default function ParkEditDialog({ open, onClose, wagon, onUpdate }) {
  const [newArendator, setNewArendator] = useState('')

  const handleSave = async () => {
    console.log(`Заменить арендатора вагона ${wagon?.wagon_number} на ${newArendator}`)
    // Здесь позже будет логика замены арендатора
    onClose()
    if (onUpdate) onUpdate()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Изменение арендатора</DialogTitle>
      <DialogContent>
        <TextField
          label="Новый арендатор"
          fullWidth
          value={newArendator}
          onChange={e => setNewArendator(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained">Сохранить</Button>
      </DialogActions>
    </Dialog>
  )
}
