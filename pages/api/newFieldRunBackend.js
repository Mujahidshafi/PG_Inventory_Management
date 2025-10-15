import { supabase } from "../../lib/supabaseClient";

export default async function handler(request, response) {
  console.log("API called:", request.method); 
  console.log("Payload:", request.body);      

  if (request.method === "POST") {
    const { fieldLotNumber, productDescription, Weight, Moisture, Location, dateTime } = request.body;

    const { data, error } = await supabase.from("field_runs").insert([{
      field_lot_number: fieldLotNumber,
      product_description: productDescription,
      weight: Weight,
      moisture: Moisture,
      location: Location,
      date_time: dateTime,
    }]);

    console.log("Supabase response:", { data, error }); 

    if (error) {
      return response.status(500).json({ message: "Failed", error: error.message });
    }

    return response.status(200).json({ message: "Success", data });
  }

  response.status(405).json({ message: "Invalid" });
}