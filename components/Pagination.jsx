import { Box, Button } from '@mui/material'

export default function Pagination({ page, setPage, total, pageSize }) {
  if (!total || total <= pageSize) return null

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Box sx={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
      <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
        ⬅ Пред.
      </Button>
      <span style={{ margin: '0 1rem' }}>Страница {page} из {totalPages}</span>
      <Button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
        След. ➡
      </Button>
    </Box>
  )
}
