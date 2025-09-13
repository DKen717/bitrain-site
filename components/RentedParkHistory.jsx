import {
  Dialog, DialogTitle, DialogContent,
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useState } from 'react'
import { supabase } from '../src/supabaseClient'

export default function RentedParkHistory({ open, onClose, wagon }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (open && wagon?.wagon_number) loadHistory()
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

  const loadHistory = async () => {
    const cid = await resolveCompanyIdByUserId()
    if (!cid) return

    const { data, error } = await supabase
      .from('Arendatori')
      .select('*')
      .eq('company_id', cid)
      .eq('wagon_number', wagon.wagon_number)
      .eq('is_deleted', false)
      .order('lease_start', { ascending: false, nullsFirst: false })
      .order('data_dobavlen', { ascending: false })

    if (error) {
      console.error(error)
      setHistory([])
      return
    }

    const arr = data || []

    // --- подтягиваем ФИО из users_custom по created_by ---
    const userIds = [...new Set(arr.map(r => r.created_by).filter(Boolean))]
    let nameById = {}
    if (userIds.length) {
      const { data: users, error: uErr } = await supabase
        .from('users_custom')
        .select('user_id, full_name')
        .in('user_id', userIds)

      if (!uErr && users) {
        nameById = Object.fromEntries(users.map(u => [u.user_id, u.full_name || '']))
      }
    }

    const enriched = arr.map(r => ({
      ...r,
      created_by_name: nameById[r.created_by] || r.created_by || ''
    }))

    setHistory(enriched)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        История по вагону {wagon?.wagon_number}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!history.length && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>История не найдена.</Typography>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Арендатор</TableCell>
              <TableCell>Аренда с</TableCell>
              <TableCell>Аренда по</TableCell>
              <TableCell>Ставка</TableCell>
              <TableCell>№ док.</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Кто</TableCell>
              <TableCell>Когда добавлено</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map(row => (
              <TableRow key={row.id}>
                <TableCell>{row.name_arendator || ''}</TableCell>
                <TableCell>{formatDate(row.lease_start)}</TableCell>
                <TableCell>{formatDate(row.lease_end)}</TableCell>
                <TableCell>{row.lease_rate_per_day ?? ''}</TableCell>
                <TableCell>{row.doc_number || ''}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.is_active ? 'В аренде' : 'Исключён'}
                    color={row.is_active ? 'success' : 'default'}
                    variant={row.is_active ? 'filled' : 'outlined'}
                  />
                </TableCell>
                {/* выводим ФИО из users_custom */}
                <TableCell>{row.created_by_name}</TableCell>
                <TableCell>{formatDate(row.data_dobavlen)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
