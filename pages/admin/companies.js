import { useEffect, useState } from 'react'
import {
  Box, Typography, TextField, Button, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, IconButton
} from '@mui/material'
import { supabase } from '../../src/supabaseClient'
import TopNav from '../../components/TopNav'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [newCompanyName, setNewCompanyName] = useState('')
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCompanies(data)
  }

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return
    const { error } = await supabase.from('companies').insert([{ name: newCompanyName }])
    if (!error) {
      setNewCompanyName('')
      loadCompanies()
    } else {
      console.error('Ошибка добавления компании:', error)
    }
  }

  const handleEdit = (company) => {
    setEditingCompanyId(company.id)
    setEditedName(company.name)
  }

  const handleSaveEdit = async (id) => {
    const { error } = await supabase
      .from('companies')
      .update({ name: editedName })
      .eq('id', id)
    if (!error) {
      setEditingCompanyId(null)
      setEditedName('')
      loadCompanies()
    } else {
      console.error('Ошибка обновления компании:', error)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = confirm('Удалить компанию? Это действие необратимо.')
    if (!confirmed) return
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (!error) loadCompanies()
    else console.error('Ошибка удаления компании:', error)
  }

  return (
    <>
      <TopNav />
      <Box sx={{ padding: '2rem' }}>
        <Typography variant="h5" gutterBottom>Управление компаниями</Typography>

        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="subtitle1">Добавить новую компанию</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label="Название компании"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddCompany}>➕ Добавить</Button>
          </Box>
        </Paper>

        <Typography variant="subtitle1" gutterBottom>Список компаний</Typography>
        <Table component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.id}</TableCell>

                <TableCell>
                  {editingCompanyId === company.id ? (
                    <TextField
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      size="small"
                    />
                  ) : (
                    company.name
                  )}
                </TableCell>

                <TableCell>{new Date(company.created_at).toLocaleString()}</TableCell>

                <TableCell align="right">
                  {editingCompanyId === company.id ? (
                    <IconButton onClick={() => handleSaveEdit(company.id)} color="primary">
                      <SaveIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => handleEdit(company)} color="primary">
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleDelete(company.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  )
}
