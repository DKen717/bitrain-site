// pages/counterparties.jsx
import { useEffect, useState } from 'react'
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Box, MenuItem, Switch, Alert,
  TableContainer, Paper, CircularProgress, Stack
} from '@mui/material'
import Link from 'next/link'
import { supabase } from '../src/supabaseClient'
import AppLayout from '../components/AppLayout'

const TYPE_OPTIONS = ['Арендатор', 'Собственник']

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name_full: '',
    name_short: '',
    type: '',
    iin_bin: '',
    contact_name: '',
    contact_phone: '',
