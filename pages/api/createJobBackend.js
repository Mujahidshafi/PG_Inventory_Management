import { supabase } from "../../lib/supabaseClient";

export default async function handler(request, response) {
  console.log("API called:", request.method); 
  console.log("Payload:", request.body);      

  if (request.method === "POST") {
    const {productDescription, location, lotNumber, amount, processId, jobType} = request.body;

    const { data, error } = await supabase.from("create_job").insert([{
        product_description: productDescription,
        location: location,
        lot_number: lotNumber,
        amount: amount,
        process_id: processId,
        job_type: jobType,
    }]);

    console.log("Supabase response:", { data, error }); 

    if (error) {
      return response.status(500).json({ message: "Failed", error: error.message });
    }

    return response.status(200).json({ message: "Success", data });
  }

  response.status(405).json({ message: "Invalid" });
}