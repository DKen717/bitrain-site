import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function OwnedWagonAdd({ open, onClose, onSaved }) {
  const [companyId, setCompanyId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    wagon_number: '',
    accepted_at: '',
    lessor_name: '',
    doc_number: '',
    lease_rate_per_day: '',
    lease_start: '',
    lease_end: '',
    notes: ''
  })

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session?.user?.user_metadata?.company_id) {
        setCompanyId(data.session.user.user_metadata.company_id)
      }
    }
    getSession()
  }, [])

  const onChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    if (!companyId) return alert('Не найден company_id в сессии пользователя.')
    if (!form.wagon_number) return alert('Укажите номер вагона.')

    setSaving(true)
    try {
      const payload = {
        owner_company_id: companyId,
        wagon_number: Number(form.wagon_number),
        accepted_at: form.accepted_at || null,
        lessor_name: form.lessor_name || null,
        doc_number: form.doc_number || null,
        lease_rate_per_day: form.lease_rate_per_day ? Number(form.lease_rate_per_day) : null,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
        notes: form.notes || null,
        is_owned: true
      }

      const { error } = await supabase
        .from('my_wagons')
        .upsert([payload], { onConflict: 'wagon_number' })

      if (error) throw error
      onSaved && onSaved()

      // очистить форму
      setForm({
        wagon_number: '',
        accepted_at: '',
        lessor_name: '',
        doc_number: '',
        lease_rate_per_day: '',
        lease_start: '',
        lease_end: '',
        notes: ''
      })
    } catch (e) {
      console.error(e)
      alert('Ошибка сохранения: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Добавить собственный вагон</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Номер вагона"
              type="number"
              value={form.wagon_number}
              onChange={onChange('wagon_number')}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Дата принятия"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.accepted_at}
              onChange={onChange('accepted_at')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Арендодатель"
              value={form.lessor_name}
              onChange={onChange('lessor_name')}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="№ документа (акт)"
              value={form.doc_number}
              onChange={onChange('doc_number')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Ставка, тг/сутки"
              type="number"
              value={form.lease_rate_per_day}
              onChange={onChange('lease_rate_per_day')}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4} />

          <Grid item xs={12} md={4}>
            <TextField
              label="Срок аренды (с)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.lease_start}
              onChange={onChange('lease_start')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Срок аренды (по)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.lease_end}
              onChange={onChange('lease_end')}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Примечание"
              value={form.notes}
              onChange={onChange('notes')}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Отмена</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
