import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Dialog, Typography
} from '@mui/material'
import { supabase } from '../src/supabaseClient'
import ParkHistoryDialog from './ParkHistoryDialog'
import ParkEditDialog from './ParkEditDialog'
import AddTransferDialog from './AddTransferDialog'


export default function ParkTable() {
  const [wagons, setWagons] = useState([])
  const [filters, setFilters] = useState({ wagon: '', arendator: '' })
  const [selectedWagon, setSelectedWagon] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data, error } = await supabase
      .from('Arendatori')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('wagon_number', { ascending: true })

    console.log('🚂 arendatori data:', data)
    console.log('⚠️ error:', error)

    if (error) console.error(error)
    else setWagons(data)
  }

  const handleHistory = (wagon) => {
    setSelectedWagon(wagon)
    setShowHistory(true)
  }

  const handleEdit = (wagon) => {
    setSelectedWagon(wagon)
    setShowEdit(true)
  }

  const [showAddDialog, setShowAddDialog] = useState(false)

  
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
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

  
  return (
    <>
      <TextField
        label="Номер вагона"
        value={filters.wagon}
        onChange={e => setFilters({ ...filters, wagon: e.target.value })}
        sx={{ mr: 2 }}
      />
      <TextField
        label="Арендатор"
        value={filters.arendator}
        onChange={e => setFilters({ ...filters, arendator: e.target.value })}
        sx={{ mr: 2 }}
      />
      <Button variant="outlined" onClick={loadData}>Обновить</Button>

      
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => setShowAddDialog(true)}>
        Добавить передачу
      </Button>
      
      <Typography sx={{ mt: 2 }}>
      Показано: {wagons.length} вагонов
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
              (!filters.wagon || w.wagon_number.includes(filters.wagon)) &&
              (!filters.arendator || w.arendator.toLowerCase().includes(filters.arendator.toLowerCase()))
            )
            .map(w => (
              <TableRow key={w.id}>
                <TableCell>{w.wagon_number}</TableCell>
                <TableCell>{w.name_arendator}</TableCell>
                <TableCell>{formatDate(w.data_peredachi)}</TableCell>
                <TableCell>{formatDate(w.data_dobavlen)}</TableCell>
                <TableCell>
                  <Button onClick={() => handleHistory(w)}>История</Button>
                  <Button onClick={() => handleEdit(w)}>Изменить</Button>
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

      <ParkEditDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        wagon={selectedWagon}
        onUpdate={loadData}
      />

      <AddTransferDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={loadData}
      />

    </>
  )
}
