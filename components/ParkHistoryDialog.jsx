// components/ParkHistoryDialog.jsx
import { Dialog, DialogTitle, DialogContent, Typography } from '@mui/material'

export default function ParkHistoryDialog({ open, onClose, wagon }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>История передач вагона</DialogTitle>
      <DialogContent>
        <Typography>
          История для вагона: {wagon?.wagon_number || 'не выбрано'}
        </Typography>
        <Typography sx={{ mt: 2, color: 'gray' }}>
          Функциональность в разработке.
        </Typography>
      </DialogContent>
    </Dialog>
  )
}
