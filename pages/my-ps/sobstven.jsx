 import dynamic from 'next/dynamic'
 import AppLayout from '../../components/AppLayout'
 import { Container, Typography } from '@mui/material'

 const OwnedParkTable = dynamic(
   () => import('../../components/OwnedParkTable'),
   { ssr: false }
 )

 export default function MyPsSobstven() {
   return (
     <AppLayout>
       <Container sx={{ py: 3 }}>
         <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
           Мой ПС — Вагоны в собственности
         </Typography>
         <OwnedParkTable />
       </Container>
     </AppLayout>
   )
 }
