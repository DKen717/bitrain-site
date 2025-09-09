import { useState, useMemo, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, MenuItem
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function OwnedWagonAdd({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [lessorId, setLessorId] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [leaseRatePerDay, setLeaseRatePerDay] = useState('')
  const [notes, setNotes] = useState('')

  const [lessorOptions, setLessorOptions] = useState([]) // [{id, label}]

  // парсинг номеров (как у арендаторов: 8 цифр, через Enter/запятую)
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

  useEffect(() => {
    if (!open) return
    const fetchLessors = async () => {
      // тянем из counterparties всех с type='Арендодатель'
      const { data, error } = await supabase
        .from('counterparties')
        .select('id, name_short, name')
        .eq('type', 'Арендодатель')
        .order('name_short', { ascending: true })

      if (error) {
        console.error('counterparties load error:', error)
        setLessorOptions([])
        return
      }
      const options = (data || []).map(r => ({
        id: r.id,
        label: r.name_short || r.name || '(без названия)'
      }))
      setLessorOptions(options)
    }
    fetchLessors()
  }, [open])

  const handleSave = async () => {
    if (!lessorId || validWagons.length === 0) {
      alert('Выберите арендодателя и введите корректные номера вагонов.')
      return
    }

    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ])
    const companyId = sessionData?.session?.user?.user_metadata?.company_id
    if (!companyId) {
      alert('Не найден company_id в сессии пользователя.')
      return
    }

    // найдём имя арендодателя для записи в my_wagons
    const lessor = lessorOptions.find(o => o.id === lessorId)
    const lessorName = lessor?.label || ''

    const records = validWagons.map(wagon => ({
      owner_company_id: companyId,
      wagon_number: Number(wagon),
      lessor_company_id: lessorId,
      lessor_name: lessorName,
      doc_number: docNumber || null,
      lease_rate_per_day: leaseRatePerDay ? Number(leaseRatePerDay) : null,
      lease_start: leaseStart || null,
      lease_end: leaseEnd || null,
      notes: notes || null,
      is_owned: true,
      // created_by проставится по default auth.uid() если задан в БД;
      // если нет — можно добавить: created_by: userData?.user?.id
    }))

    const { error } = await supabase
      .from('my_wagons')
      .upsert(records, { onConflict: 'wagon_number' })

    if (error) {
      alert('Ошибка при добавлении: ' + error.message)
    } else {
      onClose()
      onSaved && onSaved()
      // очистим форму
      setWagonList('')
      // оставим выбранного арендодателя на следующий раз
      setDocNumber('')
      setLeaseRatePerDay('')
      setLeaseStart('')
      setLeaseEnd('')
      setNotes('')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить собственные вагоны</DialogTitle>
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
          label="Арендодатель"
          margin="dense"
          value={lessorId}
          onChange={e => setLessorId(e.target.value)}
        >
          {lessorOptions.map(opt => (
            <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="№ документа (акт)"
          fullWidth
          margin="dense"
          value={docNumber}
          onChange={e => setDocNumber(e.target.value)}
        />

        <TextField
          label="Ставка, тг/сутки"
          type="number"
          fullWidth
          margin="dense"
          value={leaseRatePerDay}
          onChange={e => setLeaseRatePerDay(e.target.value)}
        />

        <TextField
          label="Срок аренды (с)"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={leaseStart}
          onChange={e => setLeaseStart(e.target.value)}
        />
        <TextField
          label="Срок аренды (по)"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={leaseEnd}
          onChange={e => setLeaseEnd(e.target.value)}
        />

        <TextField
          label="Примечание"
          fullWidth
          margin="dense"
          multiline
          minRows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  )
}
