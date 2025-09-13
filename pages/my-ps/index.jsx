import Link from 'next/link'
import AppLayout from '../../components/AppLayout'
import { Container, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material'



export default function MyPsIndex() {
  return (
    <AppLayout>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Мой ПС
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Выберите раздел:
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardActionArea component={Link} href="/my-ps/arenda">
                <CardContent>
                  <Typography variant="h6">Вагоны в аренде</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Текущие передачи, арендаторы и периоды
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
                    Реестр собственных вагонов и текущий статус
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  )
}
