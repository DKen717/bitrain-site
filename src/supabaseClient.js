import { createClient } from '@supabase/supabase-js'

// Замените эти значения на свои из Supabase → Settings → API
const supabaseUrl = 'https://axtpugpwqyjadpbuqemi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHB1Z3B3cXlqYWRwYnVxZW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzAzNzYsImV4cCI6MjA2MzMwNjM3Nn0.eoxkXa9aV27X-3be0jpvfDu9QylpeWC3C7Tcg9IPn3s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
