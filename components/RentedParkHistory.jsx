import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function RentedParkHistory({ open, onClose, wagon }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (open && wagon) {
      loadHistory()
    }
  }, [open, wagon])

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('Arendatori')
      .select('*')
      .eq('wagon_number', wagon.wagon_number)
      .order('data_peredachi', { ascending: true })

    if (error) console.error(error)
    else setHistory(data)
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        История по вагону {wagon?.wagon_number}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Арендатор</TableCell>
              <TableCell>Дата передачи</TableCell>
              <TableCell>Дата изменения</TableCell>
              <TableCell>Кто добавил</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map(row => (
              <TableRow key={row.id}>
                <TableCell>{row.name_arendator}</TableCell>
                <TableCell>{formatDate(row.data_peredachi)}</TableCell>
                <TableCell>{formatDate(row.data_izmeneniya)}</TableCell>
                <TableCell>{row.created_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
