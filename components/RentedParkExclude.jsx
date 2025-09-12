import { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function ExcludeDialog({ open, onClose, onSaved }) {
  const [wagonList, setWagonList] = useState('')
  const [excludeDate, setExcludeDate] = useState('')
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

  const handleSave = async () => {
    if (!excludeDate || validWagons.length === 0) {
      alert('Укажите дату исключения и номера вагонов.')
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

      // 1) деактивировать текущую активную запись
      const { error: updErr } = await supabase
        .from('Arendatori')
        .update({ is_active: false })
        .eq('company_id', cid)
        .eq('wagon_number', num)
        .eq('is_active', true)
      if (updErr) { errors.push(`Вагон ${w}: update error: ${updErr.message}`); continue }

      // 2) вставить новую запись-«исключение» (не активная, без арендатора)
      const rec = {
        wagon_number: num,
        name_arendator: null,
        lease_start: excludeDate,   // ← Дата исключения "С"
        lease_end: null,            // ← больше не используем здесь
        lease_rate_per_day: null,
        doc_number: null,
        company_id: cid,
        created_by: uid || null,
        is_active: false,
        is_deleted: false,
      }
      await supabase.from('Arendatori').insert(rec)
    }

    setSaving(false)

    if (errors.length) {
      alert('Часть записей не сохранена:\n' + errors.join('\n'))
      return
    }
    onClose()
    onSaved && onSaved()
    setWagonList(''); setExcludeDate('')
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Исключить вагоны</DialogTitle>
      <DialogContent>
        <TextField
          label="Номера вагонов (8 цифр, через Enter или запятую)"
          fullWidth multiline minRows={3} sx={{ mt: 1 }}
          value={wagonList} onChange={e => setWagonList(e.target.value)}
          error={invalidWagons.length > 0}
          helperText={invalidWagons.length ? `Игнорируются: ${invalidWagons.join(', ')}` : ''}
        />
        <Typography sx={{ mt: 1, mb: 1 }}>
          Будет исключено: <strong>{validWagons.length}</strong> вагонов
        </Typography>

        <TextField
          label="Дата исключения" type="date" fullWidth margin="dense"
          InputLabelProps={{ shrink: true }}
          value={excludeDate} onChange={e => setExcludeDate(e.target.value)}
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
