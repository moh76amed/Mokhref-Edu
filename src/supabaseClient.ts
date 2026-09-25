import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgjzkssatssxyihyefmm.supabase.co'
const supabaseKey = 'sb_publishable_2d-YZT_rKhEGOIkxz-yi0Q_eb-gfzVO'

export const supabase = createClient(supabaseUrl, supabaseKey)