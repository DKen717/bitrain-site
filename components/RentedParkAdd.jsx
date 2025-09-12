import { useState, useMemo, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, MenuItem
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function RentedParkAdd({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [arendatorName, setArendatorName] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [leaseRatePerDay, setLeaseRatePerDay] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [arendatorOptions, setArendatorOptions] = useState([])
  const [saving, setSaving] = useState(false)

  const validWagons = useMemo(() =>
    wagonList.split(/[\n,]+/).map(w => w.trim()).filter(w => /^[0-9]{8}$/.test(w))
  , [wagonList])

  const invalidWagons = useMemo(() =>
    wagonList.split(/[\n,]+/).map(w => w.trim()).filter(w => w && !/^[0-9]{8}$/.test(w))
  , [wagonList])

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

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const { data } = await supabase
        .from('counterparties')
        .select('name_short')
        .eq('type','Арендатор')
        .eq('is_active', true)
        .order('name_short', { ascending: true })
      setArendatorOptions((data || []).map(a => a.name_short))
    })()
  }, [open])

  const handleSave = async () => {
    if (!arendatorName || !leaseStart || validWagons.length === 0) {
      alert('Заполните: Арендатор, Аренда с, номера вагонов.')
      return
    }
    const cid = await resolveCompanyIdByUserId()
    if (!cid) { alert('company_id не найден.'); return }
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id

    setSaving(true)
    const errors = []

    for (const w of validWagons) {
      const num = Number(w)

      // 1) деактивировать текущую активную запись по вагону
      const { error: updErr } = await supabase
        .from('Arendatori')
        .update({ is_active: false })
        .eq('company_id', cid)
        .eq('wagon_number', num)
        .eq('is_active', true)
      if (updErr) { errors.push(`Вагон ${w}: update error: ${updErr.message}`); continue }

      // 2) вставить новую активную
      const rec = {
        wagon_number: num,
        name_arendator: arendatorName,
        lease_start: leaseStart || null,
        lease_end: leaseEnd || null,
        lease_rate_per_day: leaseRatePerDay ? Number(leaseRatePerDay) : null,
        doc_number: docNumber || null,
        company_id: cid,
        created_by: uid || null,
        is_active: true,
        is_deleted: false,
        data_dobavlen: new Date().toISOString().slice(0,10) // для истории/отчёта
      }
      const { error: insErr } = await supabase.from('Arendatori').insert(rec)
      if (insErr) errors.push(`Вагон ${w}: insert error: ${insErr.message}`)
    }

    setSaving(false)

    if (errors.length) {
      alert('Часть записей не сохранена:\n' + errors.join('\n'))
      return
    }
    onClose()
    onSaved && onSaved()
    setWagonList(''); setArendatorName(''); setLeaseStart(''); setLeaseEnd(''); setLeaseRatePerDay(''); setDocNumber('')
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить вагоны в аренду</DialogTitle>
      <DialogContent>
        <TextField
          label="Номера вагонов (8 цифр, через Enter или запятую)"
          fullWidth multiline minRows={3} sx={{ mt: 1 }}
          value={wagonList} onChange={e => setWagonList(e.target.value)}
          error={invalidWagons.length > 0}
          helperText={invalidWagons.length ? `Игнорируются: ${invalidWagons.join(', ')}` : ''}
        />
        <Typography sx={{ mt: 1, mb: 1 }}>
          Будет добавлено: <strong>{validWagons.length}</strong> вагонов
        </Typography>

        <TextField
          select fullWidth name="arendatorName" label="Арендатор" margin="dense"
          value={arendatorName} onChange={e => setArendatorName(e.target.value)}
        >
          {arendatorOptions.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="Аренда с" type="date" fullWidth margin="dense"
          InputLabelProps={{ shrink: true }}
          value={leaseStart} onChange={e => setLeaseStart(e.target.value)}
        />
        <TextField
          label="Аренда по" type="date" fullWidth margin="dense"
          InputLabelProps={{ shrink: true }}
          value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)}
        />

        <TextField
          label="Ставка, тг/сутки" type="number" fullWidth margin="dense"
          value={leaseRatePerDay} onChange={e => setLeaseRatePerDay(e.target.value)}
        />
        <TextField
          label="№ документа" fullWidth margin="dense"
          value={docNumber} onChange={e => setDocNumber(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Отмена</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
