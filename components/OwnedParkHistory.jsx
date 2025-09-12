// components/OwnedParkHistory.jsx
import {
  Dialog, DialogTitle, DialogContent,
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function OwnedParkHistory({ open, onClose, wagon }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (open && wagon?.wagon_number) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wagon?.wagon_number])

  const resolveCompanyIdByUserId = async () => {
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    if (!uid) return ''
    const { data: prof } = await supabase
      .from('users_custom').select('company_id').eq('user_id', uid).single()
    return prof?.company_id ||
      u?.user?.user_metadata?.company_id ||
      u?.user?.user_metadata?.companyId || ''
  }

  const load = async () => {
    try {
      const cid = await resolveCompanyIdByUserId()
      if (!cid) return
      const { data, error } = await supabase
        .from('my_wagons')
        .select('id, wagon_number, lessor_name, doc_number, lease_rate_per_day, lease_start, lease_end, is_owned, created_by, created_at, updated_at')
        .eq('owner_company_id', cid)
        .eq('wagon_number', wagon.wagon_number)
        .order('created_at', { ascending: true })
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      console.error('history load error:', e)
      setRows([])
    }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleString('ru-RU') : ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        История по вагону {wagon?.wagon_number}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!rows.length && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            История не найдена.
          </Typography>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Арендодатель</TableCell>
              <TableCell>№ док.</TableCell>
              <TableCell>Ставка</TableCell>
              <TableCell>Срок (с)</TableCell>
              <TableCell>Срок (по)</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Создал</TableCell>
              <TableCell>Создано</TableCell>
              <TableCell>Изменено</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.lessor_name || ''}</TableCell>
                <TableCell>{r.doc_number || ''}</TableCell>
                <TableCell>{r.lease_rate_per_day ?? ''}</TableCell>
                <TableCell>{r.lease_start || ''}</TableCell>
                <TableCell>{r.lease_end || ''}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.is_owned ? 'Активен' : 'Не активен'}
                    color={r.is_owned ? 'success' : 'default'}
                    variant={r.is_owned ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{r.created_by || ''}</TableCell>
                <TableCell>{fmtDate(r.created_at)}</TableCell>
                <TableCell>{fmtDate(r.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
