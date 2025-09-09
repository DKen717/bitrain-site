import AppLayout from '../../components/AppLayout'
import { Container, Typography, Card, CardContent } from '@mui/material'

export default function MyPsSobstven() {
  return (
    <AppLayout>
      <Container sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          Мой ПС — Вагоны в собственности
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Здесь появится таблица собственных вагонов с фильтрами и историей.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </AppLayout>
  )
}
