import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Typography
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { supabase } from '../src/supabaseClient'
import ParkHistoryDialog from './RentedParkHistory'
import AddTransferDialog from './RentedParkAdd'

export default function ParkTable() {
  const [wagons, setWagons] = useState([])
  const [filters, setFilters] = useState({ wagons: [], arendators: [] })
  const [wagonOptions, setWagonOptions] = useState([])
  const [arendatorOptions, setArendatorOptions] = useState([])

  const [selectedWagon, setSelectedWagon] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadData()
    loadFilterOptions()
  }, [])

  async function loadData() {
    const { data, error } = await supabase
      .from('Arendatori')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('wagon_number', { ascending: true })

    if (error) console.error('⚠️ loadData error:', error)
    else setWagons(data)
  }

  async function loadFilterOptions() {
    const { data: wagonsData } = await supabase
      .from('Arendatori')
      .select('wagon_number')
      .eq('is_active', true)
      .eq('is_deleted', false)

    const { data: arendatorData } = await supabase
      .from('Arendatori')
      .select('name_arendator')
      .eq('is_active', true)
      .eq('is_deleted', false)

    const uniqueWagons = [...new Set(wagonsData.map(w => w.wagon_number))]
    const uniqueArendators = [...new Set(arendatorData.map(a => a.name_arendator))]

    setWagonOptions(uniqueWagons)
    setArendatorOptions(uniqueArendators)
  }

  const handleHistory = (wagon) => {
    setSelectedWagon(wagon)
    setShowHistory(true)
  }


  const handleDelete = async (row) => {
    const confirm = window.confirm(`Удалить вагон ${row.wagon_number} из активного парка?`)
    if (!confirm) return

    const { error } = await supabase
      .from('Arendatori')
      .update({ is_active: false, is_deleted: true })
      .eq('id', row.id)

    if (error) {
      alert('Ошибка при удалении: ' + error.message)
    } else {
      loadData()
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Autocomplete
          multiple
          options={wagonOptions}
          value={filters.wagons}
          onChange={(e, newValue) => setFilters({ ...filters, wagons: newValue })}
          renderInput={(params) => (
            <TextField {...params} label="Номера вагонов" size="small" />
          )}
          sx={{ width: 300 }}
        />

        <Autocomplete
          multiple
          options={arendatorOptions}
          value={filters.arendators}
          onChange={(e, newValue) => setFilters({ ...filters, arendators: newValue })}
          renderInput={(params) => (
            <TextField {...params} label="Арендаторы" size="small" />
          )}
          sx={{ width: 300 }}
        />

        <Button variant="outlined" onClick={loadData}>Обновить</Button>
      </div>

      <Button variant="contained" sx={{ mt: 1 }} onClick={() => setShowAddDialog(true)}>
        Добавить передачу
      </Button>

      <Typography sx={{ mt: 2 }}>
        Показано: {
          wagons.filter(w =>
            (filters.wagons.length === 0 || filters.wagons.includes(w.wagon_number)) &&
            (filters.arendators.length === 0 || filters.arendators.includes(w.name_arendator))
          ).length
        } вагонов
      </Typography>

      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Номер вагона</TableCell>
            <TableCell>Арендатор</TableCell>
            <TableCell>Дата передачи</TableCell>
            <TableCell>Добавлен</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {wagons
            .filter(w =>
                (filters.wagons.length === 0 || filters.wagons.includes(w.wagon_number)) &&
                (filters.arendators.length === 0 || filters.arendators.includes(w.name_arendator))
              )
              .map(w => (
              <TableRow key={w.id}>
                <TableCell>{w.wagon_number}</TableCell>
                <TableCell>{w.name_arendator}</TableCell>
                <TableCell>{formatDate(w.data_peredachi)}</TableCell>
                <TableCell>{formatDate(w.data_dobavlen)}</TableCell>
                <TableCell>
                  <Button onClick={() => handleHistory(w)}>История</Button>
                  <Button color="error" onClick={() => handleDelete(w)}>Удалить</Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

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
    </>
  )
}
