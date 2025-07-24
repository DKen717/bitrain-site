import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Dialog
} from '@mui/material'
import { supabase } from '../src/supabaseClient'
import ParkHistoryDialog from './ParkHistoryDialog'
import ParkEditDialog from './ParkEditDialog'

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
      .from('arendatori')
      .select('*')
      .eq('is_active', true)
      .order('wagon_number', { ascending: true })

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

      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Номер вагона</TableCell>
            <TableCell>Арендатор</TableCell>
            <TableCell>Дата передачи</TableCell>
            <TableCell>Изменено</TableCell>
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
                <TableCell>{w.arendator}</TableCell>
                <TableCell>{w.transfer_date}</TableCell>
                <TableCell>{new Date(w.change_date).toLocaleString()}</TableCell>
                <TableCell>
                  <Button onClick={() => handleHistory(w)}>История</Button>
                  <Button onClick={() => handleEdit(w)}>Изменить</Button>
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
    </>
  )
}
