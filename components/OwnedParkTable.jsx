import { useEffect, useMemo, useState } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Typography, Box
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'
import ParkHistoryDialog from './RentedParkHistory'   // проверь точное имя файла
import OwnedWagonAdd from './OwnedWagonAdd'

export default function OwnedParkTable() {
  const [rows, setRows] = useState([])          // my_wagons + tenant merge
  const [filters, setFilters] = useState({
    wagons: [],
    lessors: [],
    leasedNow: 'all',        // all | yes | no
    acceptedFrom: '',
    acceptedTo: ''
  })

  const [wagonOptions, setWagonOptions] = useState([])
  const [lessorOptions, setLessorOptions] = useState([])

  const [selectedWagon, setSelectedWagon] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadData()
    loadFilterOptions()
  }, [])

  async function loadData() {
    // 1) собственные вагоны
    const { data: mw, error: e1 } = await supabase
      .from('my_wagons')
      .select('*')
      .eq('is_owned', true)
      .order('wagon_number', { ascending: true })

    if (e1) {
      console.error('⚠️ my_wagons load error:', e1)
      setRows([])
      return
    }

    const wagonNums = (mw || []).map(r => r.wagon_number).filter(Boolean)

    // 2) активные арендаторы для этих вагонов
    let tenantsMap = new Map()
    if (wagonNums.length) {
      const { data: tenants, error: e2 } = await supabase
        .from('Arendatori') // использую регистр как у тебя в коде
        .select('wagon_number, name_arendator, data_peredachi, data_izmeneniya')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .in('wagon_number', wagonNums)

      if (e2) {
        console.error('⚠️ tenants load error:', e2)
      } else if (tenants?.length) {
        tenants
          .sort((a, b) => new Date(b.data_peredachi || 0) - new Date(a.data_peredachi || 0))
          .forEach(t => {
            if (!tenantsMap.has(t.wagon_number)) tenantsMap.set(t.wagon_number, t)
          })
      }
    }

    // 3) мерджим
    const merged = (mw || []).map(r => {
      const t = tenantsMap.get(r.wagon_number)
      return {
        ...r,
        leased_now: !!t,
        current_tenant: t?.name_arendator || null,
        tenant_from: t?.data_peredachi || null,
        tenant_to: t?.data_izmeneniya || null
      }
    })

    setRows(merged)
  }

  async function loadFilterOptions() {
    // номера
    const { data: w, error: e1 } = await supabase
      .from('my_wagons')
      .select('wagon_number')
      .eq('is_owned', true)

    if (!e1 && w) {
      setWagonOptions([...new Set(w.map(x => x.wagon_number).filter(Boolean))])
    }

    // арендодатели
    const { data: l, error: e2 } = await supabase
      .from('my_wagons')
      .select('lessor_name')
      .eq('is_owned', true)

    if (!e2 && l) {
      setLessorOptions([...new Set(l.map(x => x.lessor_name).filter(Boolean))])
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const d = new Date(dateString)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.wagons.length && !filters.wagons.includes(r.wagon_number)) return false
      if (filters.lessors.length && !filters.lessors.includes(r.lessor_name)) return false
      if (filters.leasedNow === 'yes' && !r.leased_now) return false
      if (filters.leasedNow === 'no' && r.leased_now) return false
      if (filters.acceptedFrom) {
        if (!r.accepted_at || new Date(r.accepted_at) < new Date(filters.acceptedFrom)) return false
      }
      if (filters.acceptedTo) {
        if (!r.accepted_at || new Date(r.accepted_at) > new Date(filters.acceptedTo)) return false
      }
      return true
    })
  }, [rows, filters])

  const handleHistory = (wagonNumber) => {
    setSelectedWagon({ wagon_number: wagonNumber })
    setShowHistory(true)
  }

  return (
    <>
      {/* Фильтры */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Autocomplete
          multiple
          options={wagonOptions}
          value={filters.wagons}
          onChange={(_e, v) => setFilters(prev => ({ ...prev, wagons: v }))}
          renderInput={(params) => <TextField {...params} label="Номера вагонов" size="small" />}
          sx={{ width: 300 }}
        />

        <Autocomplete
          multiple
          options={lessorOptions}
          value={filters.lessors}
          onChange={(_e, v) => setFilters(prev => ({ ...prev, lessors: v }))}
          renderInput={(params) => <TextField {...params} label="Арендодатели" size="small" />}
          sx={{ width: 300 }}
        />

        <TextField
          select
          size="small"
          label="Сдан сейчас?"
          value={filters.leasedNow}
          onChange={(e) => setFilters(prev => ({ ...prev, leasedNow: e.target.value }))}
          SelectProps={{ native: true }}
          sx={{ width: 160 }}
        >
          <option value="all">Все</option>
          <option value="yes">Да</option>
          <option value="no">Нет</option>
        </TextField>

        <TextField
          size="small"
          type="date"
          label="Дата принятия c"
          InputLabelProps={{ shrink: true }}
          value={filters.acceptedFrom}
          onChange={(e) => setFilters(prev => ({ ...prev, acceptedFrom: e.target.value }))}
        />
        <TextField
          size="small"
          type="date"
          label="Дата принятия по"
          InputLabelProps={{ shrink: true }}
          value={filters.acceptedTo}
          onChange={(e) => setFilters(prev => ({ ...prev, acceptedTo: e.target.value }))}
        />

        <Button variant="outlined" onClick={() => { loadData(); loadFilterOptions(); }}>
          Обновить
        </Button>
        <Button
          variant="text"
          onClick={() => setFilters({ wagons: [], lessors: [], leasedNow: 'all', acceptedFrom: '', acceptedTo: '' })}
        >
          Очистить
        </Button>

        <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => setShowAddDialog(true)}>
          Добавить вагон
        </Button>
      </Box>

      <Typography sx={{ mt: 1 }}>
        Показано: {filtered.length} вагонов
      </Typography>

      {/* Таблица */}
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Номер вагона</TableCell>
            <TableCell>Дата принятия</TableCell>
            <TableCell>Арендодатель</TableCell>
            <TableCell>№ документа</TableCell>
            <TableCell>Ставка, тг/сутки</TableCell>
            <TableCell>Срок аренды (с)</TableCell>
            <TableCell>Срок аренды (по)</TableCell>
            <TableCell>Текущий арендатор</TableCell>
            <TableCell>Сдан сейчас?</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.wagon_number}</TableCell>
              <TableCell>{formatDate(r.accepted_at)}</TableCell>
              <TableCell>{r.lessor_name || ''}</TableCell>
              <TableCell>{r.doc_number || ''}</TableCell>
              <TableCell>{r.lease_rate_per_day != null ? Number(r.lease_rate_per_day).toLocaleString('ru-RU') : ''}</TableCell>
              <TableCell>{formatDate(r.lease_start)}</TableCell>
              <TableCell>{formatDate(r.lease_end)}</TableCell>
              <TableCell>{r.current_tenant || '—'}</TableCell>
              <TableCell>{r.leased_now ? 'Да' : 'Нет'}</TableCell>
              <TableCell>
                <Button onClick={() => handleHistory(r.wagon_number)}>История</Button>
              </TableCell>
            </TableRow>
          ))}
          {!filtered.length && (
            <TableRow>
              <TableCell colSpan={10}>Нет данных. Проверьте фильтры или добавьте вагон.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Диалоги */}
      <ParkHistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        wagon={selectedWagon}
      />

      <OwnedWagonAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={() => { setShowAddDialog(false); loadData(); loadFilterOptions(); }}
      />
    </>
  )
}
