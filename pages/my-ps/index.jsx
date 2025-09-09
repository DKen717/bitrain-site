// pages/my-ps/index.jsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Box, Container, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material'

export default function MyPsIndex() {
  const router = useRouter()

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Мой ПС</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Выберите раздел для работы с парком:
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardActionArea component={Link} href="/my-ps/arenda">
              <CardContent>
                <Typography variant="h6">Вагоны в аренде</Typography>
                <Typography variant="body2" color="text.secondary">
                  Текущие передачи, арендаторы и периоды аренды
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardActionArea component={Link} href="/my-ps/sobstven">
              <CardContent>
                <Typography variant="h6">Вагоны в собственности</Typography>
                <Typography variant="body2" color="text.secondary">
                  Реестр собственных вагонов и их текущий статус
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Позже сюда добавим быстрые счётчики (всего, в аренде, свободны) и последние изменения.
        </Typography>
      </Box>
    </Container>
  )
}
