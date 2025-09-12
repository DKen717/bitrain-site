import { useEffect, useState, useMemo } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Typography, Chip, Box
} from '@mui/material'
import { supabase } from '../src/supabaseClient'
import OwnedParkAdd from './OwnedParkAdd'

export default function OwnedParkTable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // company_id берём по user_id из users_custom (как договорились)
  const resolveCompanyIdByUserId = async () => {
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    if (!uid) return ''
    const { data: prof } = await supabase
      .from('users_custom')
      .select('company_id')
      .eq('user_id', uid)
      .single()
    return prof?.company_id ||
      u?.user?.user_metadata?.company_id ||
      u?.user?.user_metadata?.companyId || ''
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const cid = await resolveCompanyIdByUserId()
      if (!cid) {
        setRows([])
        return
      }
      const { data, error } = await supabase
        .from('my_wagons')
        .select('id, wagon_number, lessor_name, doc_number, lease_rate_per_day, lease_start, lease_end, is_owned')
        .eq('owner_company_id', cid)
        .order('wagon_number', { ascending: true })
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const fmtDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  const handleSoftRemove = async (row) => {
    if (!window.confirm(`Снять вагон ${row.wagon_number} с собственности?`)) return
    const { error } = await supabase
      .from('my_wagons')
      .update({ is_owned: false })
      .eq('id', row.id)
    if (error) alert('Ошибка при снятии: ' + error.message)
    else loadData()
  }

  const handleHardDelete = async (row) => {
    if (!window.confirm(
      `Удалить вагон ${row.wagon_number} навсегда?\n` +
      `Все связанные записи, если есть каскадные связи, тоже будут удалены.`
    )) return

    // Если у тебя «исторические»/связанные таблицы не на каскаде,
    // удаление их нужно реализовать серверной функцией (RPC). Здесь удаляем саму запись.
    const { error } = await supabase
      .from('my_wagons')
      .delete()
      .eq('id', row.id)

    if (error) alert('Ошибка при удалении: ' + error.message)
    else loadData()
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Собственные вагоны
        </Typography>
        <Button variant="contained" onClick={() => setShowAdd(true)}>
          Добавить
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {loading ? 'Загрузка…' : `Показано: ${rows.length}`}
        </Typography>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Номер</TableCell>
            <TableCell>Арендодатель</TableCell>
            <TableCell>№ док.</TableCell>
            <TableCell>Ставка, тг/сутки</TableCell>
            <TableCell>Срок (с)</TableCell>
            <TableCell>Срок (по)</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id} hover>
              <TableCell>{row.wagon_number}</TableCell>
              <TableCell>{row.lessor_name || ''}</TableCell>
              <TableCell>{row.doc_number || ''}</TableCell>
              <TableCell>{row.lease_rate_per_day ?? ''}</TableCell>
              <TableCell>{fmtDate(row.lease_start)}</TableCell>
              <TableCell>{fmtDate(row.lease_end)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={row.is_owned ? 'Активен' : 'Не активен'}
                  color={row.is_owned ? 'success' : 'default'}
                  variant={row.is_owned ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleSoftRemove(row)}
                    disabled={!row.is_owned}
                  >
                    Снять
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleHardDelete(row)}
                  >
                    Удалить
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <OwnedParkAdd
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); loadData() }}
      />
    </>
  )
}
