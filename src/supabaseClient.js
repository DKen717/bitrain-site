import { createClient } from '@supabase/supabase-js'

// Замените эти значения на свои из Supabase → Settings → API
const supabaseUrl = 'https://axtpugpwqyjadpbuqemi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHB1Z3B3cXlqYWRwYnVxZW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzczMDM3NiwiZXhwIjoyMDYzMzA2Mzc2fQ.C_bTYXmz-Cn-gJeZHhU-EBHqM6JTo1rZDtB3A2EkPIA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
