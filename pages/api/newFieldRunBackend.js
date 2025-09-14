import { supabase } from "@/lib/supabaseClient";

export default async function handler(request, response) {
  if (request.method === "POST") {
    const { fieldLotNumber, productDescription, Weight, Moisture, Location, dateTime } = request.body;

    const { data, error } = await supabase.from("field_runs") 
      .insert([{ fieldLotNumber, productDescription, Weight, Moisture, Location, dateTime }]);

    if (error) {
      return response.status(500).json({ message: "Failed" });
    }

    return response.status(200).json({ message: "Success" });
  }

  response.status(405).json({ message: "Invalid" });
}