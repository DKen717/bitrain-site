import dynamic from 'next/dynamic'
import AppLayout from '../../components/AppLayout'
import { Container, Typography } from '@mui/material'

const RentedParkTable = dynamic(
  () => import('../../components/RentedParkTable'),
  { ssr: false }
)

export default function MyPsArenda() {
  return (
    <AppLayout>
      <Container sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          Мой ПС — Вагоны в аренде
        </Typography>
        <RentedParkTable />
      </Container>
    </AppLayout>
  )
}
