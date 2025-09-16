import { supabase } from "../../lib/supabaseClient";

export async function getStorageData() {
    const { data, error } = await supabase
    .from('field_run_storage')
    .select('location, lot_number, product, weight, date_stored');

  if (error) {
    console.error('Error fetching storage data:', error);
    return [];
  }

  return data;
}