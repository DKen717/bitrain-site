import { useEffect, useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Autocomplete
} from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function ParkFilters({ filters, setFilters, onSearch, onClear, loading }) {
  const [wagonOptions, setWagonOptions] = useState([])
  const [arendatorOptions, setArendatorOptions] = useState([])

  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    // Уникальные номера вагонов
    const { data: wagons } = await supabase
      .from('Arendatori')
      .select('wagon_number', { distinct: true })
      .order('wagon_number', { ascending: true })

    // Уникальные арендаторы
    const { data: arendators } = await supabase
      .from('Arendatori')
      .select('name_arendator', { distinct: true })
      .order('name_arendator', { ascending: true })

    setWagonOptions([...new Set(wagons?.map(w => w.wagon_number))])
    setArendatorOptions([...new Set(arendators?.map(a => a.name_arendator))])
  }

  return (
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
      {/* Фильтр по вагону */}
      <Autocomplete
        multiple
        options={wagonOptions}
        value={filters.wagonNumbers}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, wagonNumbers: newValue }))}
        renderInput={(params) => <TextField {...params} label="Номер вагона" size="small" />}
        style={{ minWidth: 250 }}
      />

      {/* Фильтр по арендатору */}
      <Autocomplete
        options={arendatorOptions}
        value={filters.arendator || null}
        onChange={(e, newValue) => setFilters(prev => ({ ...prev, arendator: newValue }))}
        renderInput={(params) => <TextField {...params} label="Арендатор" size="small" />}
        style={{ minWidth: 200 }}
      />

      <Button variant="contained" onClick={onSearch} disabled={loading}>
        Поиск
      </Button>
      <Button variant="outlined" onClick={onClear} disabled={loading}>
        Очистить
      </Button>
    </Box>
  )
}
