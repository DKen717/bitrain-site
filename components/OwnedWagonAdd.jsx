import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControlLabel, Switch
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'

export default function OwnedWagonAdd({ open, onClose, onSaved }) {
  const [companyId, setCompanyId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(true) // включаем массовый режим по умолчанию

  // Параметры договора/приёма (общие для всех вагонов при массовой вставке)
  const [form, setForm] = useState({
    single_wagon: '',        // для одиночного режима
    bulk_input: '',          // мультивставка (вставляем из таблицы/списком)
    lessor: null,            // объект { id, name }
    doc_number: '',
    lease_rate_per_day: '',
    lease_start: '',
    lease_end: '',
    notes: ''
  })

  const [lessorOptions, setLessorOptions] = useState([])

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session?.user?.user_metadata?.company_id) {
        setCompanyId(data.session.user.user_metadata.company_id)
      }
      // Подгружаем арендодателей из counterparties
      const { data: lessors, error: e2 } = await supabase
        .from('counterparties')
        .select('id, name')
        .eq('type', 'Арендодатель')
        .order('name', { ascending: true })
      if (!e2 && Array.isArray(lessors)) {
        setLessorOptions(lessors)
      }
    }
    if (open) init()
  }, [open])

  const onChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function parseBulk(input) {
    // Берём все последовательности цифр длиной 5+ (подходит для 8-значных),
    // игнорируем пробелы/табуляции/текстовые столбцы
    const matches = String(input).match(/\d{5,}/g) || []
    const unique = Array.from(new Set(matches.map(n => Number(n)).filter(n => Number.isFinite(n) && n > 0)))
    return unique
  }

  const bulkWagons = useMemo(() => parseBulk(form.bulk_input), [form.bulk_input])

  const handleSave = async () => {
    if (!companyId) return alert('Не найден company_id в сессии пользователя.')
    if (!form.lessor) return alert('Выберите арендодателя.')

    let wagonsList = []
    if (bulkMode) {
      wagonsList = bulkWagons
      if (!wagonsList.length) return alert('Вставьте номера вагонов в поле «Список номеров».')
    } else {
      const n = Number(form.single_wagon)
      if (!n) return alert('Укажите номер вагона.')
      wagonsList = [n]
    }

    setSaving(true)
    try {
      const payloads = wagonsList.map(w => ({
        owner_company_id: companyId,
        wagon_number: w,
        lessor_company_id: form.lessor.id,
        lessor_name: form.lessor.name,
        doc_number: form.doc_number || null,
        lease_rate_per_day: form.lease_rate_per_day ? Number(form.lease_rate_per_day) : null,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
        notes: form.notes || null,
        is_owned: true
      }))

      const { error } = await supabase
        .from('my_wagons')
        .upsert(payloads, { onConflict: 'wagon_number' })

      if (error) throw error
      onSaved && onSaved()

      // очистка формы
      setForm({
        single_wagon: '',
        bulk_input: '',
        lessor: form.lessor, // оставим выбранного арендодателя
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
      <DialogTitle>Добавить собственные вагоны</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={bulkMode} onChange={(e) => setBulkMode(e.target.checked)} />}
              label={bulkMode ? 'Режим: массовая вставка' : 'Режим: один вагон'}
            />
          </Grid>

          {bulkMode ? (
            <>
              <Grid item xs={12}>
                <TextField
                  label="Список номеров (вставьте из Excel/таблицы/текста)"
                  placeholder="Например: 12345678, 12345679&#10;или столбец из Excel"
                  value={form.bulk_input}
                  onChange={onChange('bulk_input')}
                  fullWidth
                  multiline
                  minRows={4}
                />
              </Grid>
              <Grid item xs={12}>
                Найдено номеров: <b>{bulkWagons.length}</b>
                {bulkWagons.length ? ` (пример: ${bulkWagons.slice(0, 10).join(', ')}${bulkWagons.length > 10 ? '…' : ''})` : ''}
              </Grid>
            </>
          ) : (
            <Grid item xs={12} md={4}>
              <TextField
                label="Номер вагона"
                type="number"
                value={form.single_wagon}
                onChange={onChange('single_wagon')}
                fullWidth
                required
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={lessorOptions}
              getOptionLabel={(o) => o?.name || ''}
              value={form.lessor}
              onChange={(_e, v) => setForm(prev => ({ ...prev, lessor: v }))}
              renderInput={(params) => <TextField {...params} label="Арендодатель" required />}
            />
          </Grid>

          <Grid item xs={12} md={6}>
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
