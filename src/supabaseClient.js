import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://axtpugpwqyjadpbuqemi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHB1Z3B3cXlqYWRwYnVxZW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzAzNzYsImV4cCI6MjA2MzMwNjM3Nn0.eoxkXa9aV27X-3be0jpvfDu9QylpeWC3C7Tcg9IPn3s'
)
