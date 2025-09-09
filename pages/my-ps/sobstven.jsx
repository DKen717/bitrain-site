// pages/my-ps/sobstven.jsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Container, Box, Tabs, Tab, Typography, Card, CardContent } from '@mui/material'

export default function MyPsSobstven() {
  const router = useRouter()
  const tabValue = 1 // 0 = аренда, 1 = собственность

  const handleTabChange = (_e, newValue) => {
    if (newValue === 0) router.push('/my-ps/arenda')
    if (newValue === 1) router.push('/my-ps/sobstven')
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Мой ПС — Вагоны в собственности</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="В аренде" component={Link} href="/my-ps/arenda" />
          <Tab label="В собственности" component={Link} href="/my-ps/sobstven" />
        </Tabs>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Здесь будет таблица собственных вагонов, индикатор «сдан сейчас?» и история.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}
