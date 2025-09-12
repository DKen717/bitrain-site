// components/CompanyInfoBar.jsx
import { useEffect, useState } from 'react'
import { Box, Typography, Button, Collapse, Chip } from '@mui/material'
import { supabase } from '../src/supabaseClient'

export default function CompanyInfoBar() {
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const [userEmail, setUserEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState(null)
  const [meta, setMeta] = useState(null)
  const [availableCompanies, setAvailableCompanies] = useState([]) // [{id,name,is_default}]

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        // 1) базовая сессия
        const { data: sessionData } = await supabase.auth.getSession()
        const sess = sessionData?.session
        const user = sess?.user
        const m = user?.user_metadata || {}
        const a = user?.app_metadata || {}
        const email = user?.email || ''
        setUserEmail(email)
        setMeta(m)

        let cid =
          m.company_id || m.companyId ||
          a.company_id || a.companyId ||
          ''

        // 2) фолбэк через profiles (если есть)
        if (!cid) {
          const { data: u } = await supabase.auth.getUser()
          const uid = u?.user?.id
          if (uid) {
            const { data: prof, error: eProf } = await supabase
              .from('profiles')
              .select('company_id')
              .eq('id', uid)
              .maybeSingle()
            if (!eProf && prof?.company_id) cid = prof.company_id
          }
        }

        // 3) какие компании доступны пользователю (если есть user_companies)
        // и имена компаний (таблица companies)
        const { data: u2 } = await supabase.auth.getUser()
        const uid2 = u2?.user?.id
        if (uid2) {
          const { data: uc } = await supabase
            .from('user_companies')
            .select('user_id, company_id, is_default')
            .eq('user_id', uid2)

          if (uc?.length) {
            const ids = [...new Set(uc.map(x => x.company_id))].filter(Boolean)
            if (ids.length) {
              const { data: comps } = await supabase
                .from('companies')
                .select('id, name')
                .in('id', ids)
              const list = (comps || []).map(c => ({
                id: c.id,
                name: c.name,
                is_default: !!uc.find(u => u.company_id === c.id && u.is_default)
              }))
              setAvailableCompanies(list)
              // если cid пуст, но есть дефолт — подставим его
              if (!cid) {
                const def = list.find(x => x.is_default) || list[0]
                cid = def?.id || cid
              }
            }
          }
        }

        setCompanyId(cid || '')

        // 4) подтянем имя компании
        if (cid) {
          const { data: comp } = await supabase
            .from('companies')
            .select('name')
            .eq('id', cid)
            .maybeSingle()
          setCompanyName(comp?.name || null)
        } else {
          setCompanyName(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Информация о компании
      </Typography>

      {loading ? (
        <Typography variant="body2">Определяем компанию…</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Chip
              label={companyId ? `company_id: ${companyId}` : 'company_id не найден'}
              color={companyId ? 'success' : 'warning'}
              variant={companyId ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              label={companyName ? `Компания: ${companyName}` : 'Имя компании не найдено'}
              variant="outlined"
              size="small"
            />
            <Chip
              label={userEmail ? `Пользователь: ${userEmail}` : 'E-mail не найден'}
              variant="outlined"
              size="small"
            />
            {!!availableCompanies.length && (
              <Chip
                label={`Доступно компаний: ${availableCompanies.length}`}
                variant="outlined"
                size="small"
              />
            )}
            <Button size="small" onClick={() => setExpanded(v => !v)}>
              {expanded ? 'Скрыть детали' : 'Показать детали'}
            </Button>
          </Box>

          <Collapse in={expanded} unmountOnExit>
            <Box sx={{ mt: 1.5 }}>
              {!!availableCompanies.length && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Компании пользователя:
                  </Typography>
                  <ul style={{ marginTop: 4, marginBottom: 4 }}>
                    {availableCompanies.map(c => (
                      <li key={c.id}>
                        <Typography variant="caption">
                          {c.name || '(без названия)'} — {c.id}
                          {c.is_default ? ' (по умолчанию)' : ''}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}

              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                user_metadata:
              </Typography>
              <pre
                style={{
                  margin: 0,
                  padding: '8px 10px',
                  background: '#0b0b0b10',
                  borderRadius: 6,
                  overflowX: 'auto'
                }}
              >
                {JSON.stringify(meta, null, 2)}
              </pre>
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  )
}
