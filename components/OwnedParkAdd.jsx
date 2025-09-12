// components/OwnedParkAdd.jsx
import { useState, useMemo, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, MenuItem
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function OwnedParkAdd({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [lessorId, setLessorId] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [leaseRatePerDay, setLeaseRatePerDay] = useState('')
  const [notes, setNotes] = useState('')

  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [lessorOptions, setLessorOptions] = useState([]) // [{id,label}]
  const [initDone, setInitDone] = useState(false)

  // 8-значные номера (через Enter/запятую), как в арендаторах
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

  // Получаем company_id по user_id (как просил):
  // 1) auth.getUser() -> user.id
  // 2) users_custom.where(user_id = user.id).single()
  // 3) фолбэк: user_metadata.company_id|companyId
  const resolveCompanyIdByUserId = async () => {
    const { data: userData, error: uErr } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid || uErr) return ''

    const { data: profile, error: pErr } = await supabase
      .from('users_custom')
      .select('company_id')
      .eq('user_id', uid)
      .single()

    if (!pErr && profile?.company_id) return profile.company_id

    // фолбэк на метаданные (на всякий случай)
    const m = userData?.user?.user_metadata || {}
    return m.company_id || m.companyId || ''
  }

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setInitDone(false)

      // 1) company_id по user_id
      const cid = await resolveCompanyIdByUserId()
      setCompanyId(cid || '')

      // имя компании (если есть таблица companies)
      if (cid) {
        const { data: c } = await supabase
          .from('companies')
          .select('name')
          .eq('id', cid)
          .maybeSingle()
        setCompanyName(c?.name || '')
      } else {
        setCompanyName('')
      }

      // 2) арендодатели (как просил: только id, name_short)
      const { data: lessors, error: lErr } = await supabase
        .from('counterparties')
        .select('id, name_short')
        .eq('type', 'Арендодатель')
        .order('name_short', { ascending: true })

      if (!lErr && Array.isArray(lessors)) {
        setLessorOptions(lessors.map(r => ({ id: r.id, label: r.name_short || '(без названия)' })))
      } else {
        console.error('counterparties load error:', lErr)
        setLessorOptions([])
      }

      setInitDone(true)
    })()
  }, [open])

  const handleSave = async () => {
    if (!lessorId || validWagons.length === 0) {
      alert('Выберите арендодателя и введите корректные номера вагонов (8 цифр).')
      return
    }
    let cid = companyId
    if (!cid) {
      cid = await resolveCompanyIdByUserId()
      setCompanyId(cid)
    }
    if (!cid) {
      alert('company_id не найден. Проверьте запись в users_custom для текущего user_id.')
      return
    }

    const lessorName = lessorOptions.find(l => l.id === lessorId)?.label || null

    const records = validWagons.map(wagon => ({
      owner_company_id: cid,
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

    // очистим форму (арендодателя оставим)
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
        {/* для наглядности выведем текущую компанию */}
        <Typography variant="caption" color="text.secondary">
          Компания: {companyName ? `${companyName} — ` : ''}{companyId || 'не определена'}
        </Typography>

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
          helperText={!lessorOptions.length ? 'Нет записей в counterparties с type=Арендодатель' : ''}
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
