// pages/my-ps.jsx
import { Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import AppLayout from '../components/AppLayout'

// если таблица 100% SSR-safe, можно убрать dynamic и импортировать напрямую
const RentedParkTable = dynamic(() => import('../components/RentedParkTable'), { ssr: false })

export default function MyPSPage() {
  return (
    <AppLayout>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Мой ПС
      </Typography>
      <RentedParkTable />
    </AppLayout>
  )
}
