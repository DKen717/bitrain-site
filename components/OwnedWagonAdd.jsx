// components/OwnedWagonAdd.jsx
import { useState, useMemo, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, MenuItem
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function OwnedWagonAdd({ open, onClose, onSaved }) {
  const [initDone, setInitDone] = useState(false)

  const [wagonList, setWagonList] = useState('')
  const [lessorId, setLessorId] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [leaseRatePerDay, setLeaseRatePerDay] = useState('')
  const [notes, setNotes] = useState('')

  const [companyId, setCompanyId] = useState('')           // берём из сессии
  const [lessorOptions, setLessorOptions] = useState([])   // [{id,label}]

  // правильный парсинг company_id из сессии с фолбэками
  const extractCompanyId = (session) => {
    const u = session?.user
    const m = u?.user_metadata || {}
    const a = u?.app_metadata || {}
    return (
      m.company_id ||
      m.companyId ||
      a.company_id ||
      a.companyId ||
      ''
    )
  }

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setInitDone(false)
      // 1) company_id из сессии
      const { data: sessionData, error: sErr } = await supabase.auth.getSession()
      if (!sErr) {
        const cid = extractCompanyId(sessionData?.session)
        setCompanyId(cid || '')
      }

      // 2) арендодатели из counterparties
      // если поля is_active нет — условие просто игнорируется RLS’ом/PG
      const { data, error } = await supabase
        .from('counterparties')
        .select('id, name_short')
        .eq('type', 'Арендодатель')
        .eq('is_active', true)
        .order('name_short', { ascending: true })

      if (!error && Array.isArray(data)) {
        const opts = data.map(r => ({
          id: r.id,
          label: r.name_short || '(без названия)'
        }))
        setLessorOptions(opts)
      } else {
        setLessorOptions([])
      }

      setInitDone(true)
    })()
  }, [open])

  // парсинг номеров (как у арендаторов: 8 цифр через Enter/запятую)
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
    if (!companyId) {
      alert('company_id не найден в сессии. Проверь user_metadata.company_id.')
      return
    }
    if (!lessorId || validWagons.length === 0) {
      alert('Выберите арендодателя и введите корректные номера вагонов (8 цифр).')
      return
    }

    const lessorName = lessorOptions.find(l => l.id === lessorId)?.label || null

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
      is_owned: true
    }))

    const { error } = await supabase
      .from('my_wagons')
      .upsert(records, { onConflict: 'wagon_number' })

    if (error) {
      alert('Ошибка при добавлении: ' + error.message)
      return
    }

    onClose()
    onSaved && onSaved()

    // очистим форму, оставляя выбранного арендодателя
    setWagonList('')
    setDocNumber('')
    setLeaseRatePerDay('')
    setLeaseStart('')
    setLeaseEnd('')
    setNotes('')
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
        <Button variant="contained" onClick={handleSave} disabled={!initDone}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
