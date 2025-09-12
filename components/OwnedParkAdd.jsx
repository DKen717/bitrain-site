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
  const [saving, setSaving] = useState(false)

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

  // company_id по user_id из users_custom (наш стандарт)
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

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setInitDone(false)

      const cid = await resolveCompanyIdByUserId()
      setCompanyId(cid || '')

      if (cid) {
        const { data: c } = await supabase
          .from('companies').select('name').eq('id', cid).maybeSingle()
        setCompanyName(c?.name || '')
      } else {
        setCompanyName('')
      }

      // список арендодателей (ты используешь FK на counterparties.id)
      const { data: lessors } = await supabase
        .from('counterparties')
        .select('id, name_short')
        .eq('type', 'Арендодатель')
        .order('name_short', { ascending: true })

      setLessorOptions((lessors || []).map(r => ({ id: r.id, label: r.name_short || '(без названия)' })))
      setInitDone(true)
    })()
  }, [open])

  const handleSave = async () => {
    if (!lessorId || validWagons.length === 0) {
      alert('Выберите арендодателя и введите корректные номера вагонов (8 цифр).')
      return
    }
    let cid = companyId || await resolveCompanyIdByUserId()
    if (!cid) {
      alert('company_id не найден. Проверьте users_custom для текущего user_id.')
      return
    }

    setSaving(true)
    const lessorName = lessorOptions.find(l => l.id === lessorId)?.label || null
    const errors = []

    // последовательно: 1) деактивируем старую активную, 2) вставляем новую
    for (const w of validWagons) {
      const num = Number(w)
      // 1) снять активный, если есть
      const { error: updErr } = await supabase
        .from('my_wagons')
        .update({ is_owned: false })
        .eq('owner_company_id', cid)
        .eq('wagon_number', num)
        .eq('is_owned', true)

      if (updErr) {
        errors.push(`Wagon ${w}: update error: ${updErr.message}`)
        continue
      }

      // 2) вставить новую запись (активную)
      const rec = {
        owner_company_id: cid,
        wagon_number: num,
        lessor_company_id: lessorId,   // FK → counterparties(id)
        lessor_name: lessorName,
        doc_number: docNumber || null,
        lease_rate_per_day: leaseRatePerDay ? Number(leaseRatePerDay) : null,
        lease_start: leaseStart || null,
        lease_end: leaseEnd || null,
        notes: notes || null,
        is_owned: true
      }

      const { error: insErr } = await supabase.from('my_wagons').insert(rec)
      if (insErr) {
        errors.push(`Wagon ${w}: insert error: ${insErr.message}`)
      }
    }

    setSaving(false)

    if (errors.length) {
      alert('Часть записей не сохранена:\n' + errors.join('\n'))
      return
    }

    onClose()
    onSaved && onSaved()

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
        <Typography variant="caption" color="text.secondary">
          Компания: {companyName ? `${companyName} — ` : ''}{companyId || 'не определена'}
        </Typography>

        <TextField
          label="Номера вагонов (8 цифр, через Enter или запятую)"
          fullWidth multiline minRows={3} sx={{ mt: 2 }}
          value={wagonList}
          onChange={e => setWagonList(e.target.value)}
          error={invalidWagons.length > 0}
          helperText={invalidWagons.length > 0 ? `Игнорируются: ${invalidWagons.join(', ')}` : ''}
        />

        <Typography sx={{ mt: 1, mb: 1 }}>
          Будет добавлено: <strong>{validWagons.length}</strong> вагонов
        </Typography>

        <TextField
          select fullWidth label="Арендодатель" margin="dense"
          value={lessorId} onChange={e => setLessorId(e.target.value)}
          helperText={!lessorOptions.length ? 'Нет записей в counterparties с type=Арендодатель' : ''}
        >
          {lessorOptions.map(opt => (
            <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
          ))}
        </TextField>

        <TextField label="№ документа (акт)" fullWidth margin="dense"
          value={docNumber} onChange={e => setDocNumber(e.target.value)} />

        <TextField label="Ставка, тг/сутки" type="number" fullWidth margin="dense"
          value={leaseRatePerDay} onChange={e => setLeaseRatePerDay(e.target.value)} />

        <TextField label="Срок аренды (с)" type="date" fullWidth margin="dense"
          InputLabelProps={{ shrink: true }} value={leaseStart} onChange={e => setLeaseStart(e.target.value)} />
        <TextField label="Срок аренды (по)" type="date" fullWidth margin="dense"
          InputLabelProps={{ shrink: true }} value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} />

        <TextField label="Примечание" fullWidth margin="dense" multiline minRows={2}
          value={notes} onChange={e => setNotes(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Отмена</Button>
        <Button variant="contained" onClick={handleSave} disabled={!initDone || !companyId || saving}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
