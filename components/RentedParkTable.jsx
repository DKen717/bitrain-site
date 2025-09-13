import { useEffect, useState, useMemo } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Typography, Box, Chip, MenuItem
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'
import ParkHistoryDialog from './RentedParkHistory'
import AddTransferDialog from './RentedParkAdd'
import ExcludeDialog from './RentedParkExclude'

export default function RentedParkTable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  // фильтры
  const [filters, setFilters] = useState({ wagons: [], arendators: [] })
  const [statusFilter, setStatusFilter] = useState('active') // all|active|inactive
  const [wagonOptions, setWagonOptions] = useState([])
  const [arendatorOptions, setArendatorOptions] = useState([])

  // диалоги
  const [selectedWagon, setSelectedWagon] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showExcludeDialog, setShowExcludeDialog] = useState(false)

  // company_id по user_id (как в owned-парке)
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
      if (!cid) { setRows([]); setWagonOptions([]); setArendatorOptions([]); return }

      // берём все (активные/неактивные), но не удалённые
      const { data, error } = await supabase
        .from('Arendatori')
        .select('*')
        .eq('company_id', cid)
        .eq('is_deleted', false)
        .order('wagon_number', { ascending: true })

      if (error) throw error
      const arr = data || []
      setRows(arr)

      // опции фильтров
      const uniqueWagons = [...new Set(arr.map(w => w.wagon_number))].filter(Boolean)
      const uniqueArendators = [...new Set(arr.map(a => a.name_arendator).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'))
      setWagonOptions(uniqueWagons)
      setArendatorOptions(uniqueArendators)
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yy = dt.getFullYear()
    return `${dd}.${mm}.${yy}`
  }

  const filtered = useMemo(() => {
    return rows.filter(w => {
      if (statusFilter === 'active' && !w.is_active) return false
      if (statusFilter === 'inactive' && w.is_active) return false
      if (filters.wagons.length && !filters.wagons.includes(w.wagon_number)) return false
      if (filters.arendators.length && !filters.arendators.includes(w.name_arendator || '')) return false
      return true
    })
  }, [rows, filters, statusFilter])

  const handleHistory = (row) => { setSelectedWagon(row); setShowHistory(true) }

  return (
    <>
      {/* Верхняя панель действий */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
        <Button variant="contained" onClick={() => setShowAddDialog(true)}>
          Добавить вагоны
        </Button>
        <Button variant="contained" onClick={() => setShowExcludeDialog(true)}>
          Исключить вагоны
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={loadData}>Обновить</Button>
          <Typography
            variant="subtitle1"
            color="text.primary"
            sx={{ alignSelf: 'center', fontWeight: 600 }}
          >
            {loading ? 'Загрузка…' : `Показано: ${filtered.length}`}
          </Typography>
        </Box>
      </Box>

      {/* Фильтры под кнопками */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <Autocomplete
          multiple
          options={wagonOptions}
          value={filters.wagons}
          onChange={(e, v) => setFilters(prev => ({ ...prev, wagons: v }))}
          renderInput={(params) => <TextField {...params} label="Номера вагонов" size="small" />}
          sx={{ width: 280 }}
        />
        <Autocomplete
          multiple
          options={arendatorOptions}
          value={filters.arendators}
          onChange={(e, v) => setFilters(prev => ({ ...prev, arendators: v }))}
          renderInput={(params) => <TextField {...params} label="Арендаторы" size="small" />}
          sx={{ width: 280 }}
        />
        <TextField
          select size="small" label="Статус"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="active">В аренде</MenuItem>
          <MenuItem value="inactive">Исключённые</MenuItem>
          <MenuItem value="all">Все</MenuItem>
        </TextField>
      </Box>

      {/* Таблица */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>№ вагона</TableCell>
            <TableCell>Арендатор</TableCell>
            <TableCell>Аренда с</TableCell>
            <TableCell>Аренда по</TableCell>
            <TableCell>Ставка, тг/сут.</TableCell>
            <TableCell>№ документа</TableCell>
            <TableCell>Добавлено</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(w => (
            <TableRow key={w.id} hover>
              <TableCell>{w.wagon_number}</TableCell>
              <TableCell>{w.name_arendator || ''}</TableCell>
              <TableCell>{formatDate(w.lease_start)}</TableCell>
              <TableCell>{formatDate(w.lease_end)}</TableCell>
              <TableCell>{w.lease_rate_per_day ?? ''}</TableCell>
              <TableCell>{w.doc_number || ''}</TableCell>
              <TableCell>{formatDate(w.data_dobavlen)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={w.is_active ? 'В аренде' : 'Исключён'}
                  color={w.is_active ? 'success' : 'default'}
                  variant={w.is_active ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleHistory(w)}>История</Button>
                {/* Кнопка удаления убрана по запросу */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Диалоги */}
      <ParkHistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        wagon={selectedWagon}
      />
      <AddTransferDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={loadData}
      />
      <ExcludeDialog
        open={showExcludeDialog}
        onClose={() => setShowExcludeDialog(false)}
        onSaved={loadData}
      />
    </>
  )
}
