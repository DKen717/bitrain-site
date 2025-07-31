import { useEffect, useState } from 'react'
import { Container, Typography } from '@mui/material'
import RentedParkTable from '../components/RentedParkTable'

export default function RentedWagonsPage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Мой ПС
      </Typography>
      <RentedParkTable />
    </Container>
  )
}
