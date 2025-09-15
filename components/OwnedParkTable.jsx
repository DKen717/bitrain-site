// components/OwnedParkTable.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Typography, Chip, Box, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, Stack
} from '@mui/material'
import { supabase } from '../src/supabaseClient'
import OwnedParkAdd from './OwnedParkAdd'
import OwnedParkHistory from './OwnedParkHistory'
import OwnedParkExclude from './OwnedParkExclude' // новый диалог

export default function OwnedParkTable() {
  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showExclude, setShowExclude] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedWagon, setSelectedWagon] = useState(null)
  const [companyId, setCompanyId] = useState('')

  // Фильтры
  const [filterNumber, setFilterNumber] = useState('')              // "12345" или "12345, 23456 ..."
  const [filterLessor, setFilterLessor] = useState('')              // exact match по названию
  const [filterStatus, setFilterStatus] = useState('active')        // 'all' | 'active' | 'inactive'

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

  const loadData = async () => {
    setLoading(true)
    try {
      const cid = await resolveCompanyIdByUserId()
      setCompanyId(cid)
      if (!cid) { setAllRows([]); setRows([]); return }

      const { data, error } = await supabase
        .from('my_wagons')
        .select(`
          id,
          owner_company_id,
          wagon_number,
          lessor_name,
          doc_number,
          lease_rate_per_day,
          lease_start,
          lease_end,
          is_owned,
          is_active,
          created_at
        `)
        .eq('owner_company_id', cid)
        .eq('is_owned', true) // показываем только собственные
        .order('wagon_number', { ascending: true })

      if (error) throw error
      const normalized = (data || []).map(r => ({
        ...r,
        // Поддержка старых записей без is_active — считаем активными
        is_active: typeof r.is_active === 'boolean' ? r.is_active : true
      }))

      setAllRows(normalized)
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Уникальные арендодатели для фильтра
  const lessorOptions = useMemo(() => {
    const s = new Set()
    allRows.forEach(r => { if (r.lessor_name) s.add(r.lessor_name) })
    return Array.from(s).sort()
  }, [allRows])

  // Применение фильтров (клиент-сайд)
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...allRows]

      // Фильтр по номеру: список номеров или подстрока
      const raw = filterNumber.trim()
      if (raw) {
        if (raw.includes(',') || raw.includes(' ')) {
          const nums = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
          const setNums = new Set(nums)
          filtered = filtered.filter(r => setNums.has(String(r.wagon_number)))
        } else {
          filtered = filtered.filter(r =>
            String(r.wagon_number).includes(raw)
          )
        }
      }

      // Фильтр по арендодателю (exact)
      if (filterLessor) {
        filtered = filtered.filter(r => (r.lessor_name || '') === filterLessor)
      }

      // Фильтр по статусу
      if (filterStatus === 'active') {
        filtered = filtered.filter(r => r.is_active === true)
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(r => r.is_active === false)
      }

      setRows(filtered)
    }
    applyFilters()
  }, [allRows, filterNumber, filterLessor, filterStatus])

  const fmtDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return ''
    return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`
  }

  const fmtDateTime = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return ''
    const dd = `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`
    const tt = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
    return `${dd} ${tt}`
  }

  // Переключение статуса Активный/Неактивный
  const handleToggleActive = async (row) => {
    const next = !row.is_active
    const { error } = await supabase
      .from('my_wagons')
      .update({ is_active: next })
      .eq('id', row.id)

    if (error) {
      alert('Не удалось изменить статус: ' + error.message)
      return
    }
    setAllRows(prev => prev.map(r => r.id === row.id ? { ...r, is_active: next } : r))
  }

  const handleHistory = (row) => {
    setSelectedWagon(row)
    setShowHistory(true)
  }

  const activeShownCount = useMemo(
    () => rows.filter(r => r.is_active).length,
    [rows]
  )

  return (
    <>
      {/* Заголовок + действия */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Собственные вагоны
        </Typography>

        <Button variant="contained" onClick={() => setShowAdd(true)}>
          Добавить вагоны
        </Button>

        <Button variant="outlined" color="warning" onClick={() => setShowExclude(true)}>
          Исключить вагоны
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Загрузка…</Typography>
          ) : (
            <Chip
              label={`Показано активных: ${activeShownCount}`}
              color="success"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>
      </Box>

      {/* Фильтры */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1 }}>
        <TextField
          size="small"
          label="Номер вагона"
          placeholder="12345 или 12345, 23456"
          value={filterNumber}
          onChange={(e) => setFilterNumber(e.target.value)}
          sx={{ minWidth: 240 }}
        />

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="lessor-label">Арендодатель</InputLabel>
          <Select
            labelId="lessor-label"
            label="Арендодатель"
            value={filterLessor}
            onChange={(e) => setFilterLessor(e.target.value)}
          >
            <MenuItem value=""><em>Все</em></MenuItem>
            {lessorOptions.map(name => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-label">Статус</InputLabel>
          <Select
            labelId="status-label"
            label="Статус"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="active">Активные</MenuItem>
            <MenuItem value="inactive">Неактивные</MenuItem>
            <MenuItem value="all">Все</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Таблица */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Номер</TableCell>
            <TableCell>Арендодатель</TableCell>
            <TableCell>№ док.</TableCell>
            <TableCell>Ставка, тг/сутки</TableCell>
            <TableCell>Срок (с)</TableCell>
            <TableCell>Срок (по)</TableCell>
            <TableCell>Добавлен</TableCell>
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
              <TableCell>{fmtDateTime(row.created_at)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={row.is_active ? 'Активный' : 'Неактивный'}
                    color={row.is_active ? 'success' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                  <Switch
                    checked={!!row.is_active}
                    onChange={() => handleToggleActive(row)}
                    inputProps={{ 'aria-label': 'Переключить активность' }}
                  />
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => handleHistory(row)}>
                  История
                </Button>
                {/* Убраны "Снять" и "Удалить" по ТЗ */}
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

      <OwnedParkExclude
        open={showExclude}
        onClose={() => setShowExclude(false)}
        companyId={companyId}
        onSaved={() => { setShowExclude(false); loadData() }}
      />

      <OwnedParkHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
        wagon={selectedWagon}
      />
    </>
  )
}
