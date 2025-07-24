// pages/my-ps.jsx
import { useEffect, useState } from 'react'
import { Container, Typography } from '@mui/material'
import ParkTable from '@/components/ParkTable'

export default function MyPSPage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Мой ПС
      </Typography>
      <ParkTable />
    </Container>
  )
}
