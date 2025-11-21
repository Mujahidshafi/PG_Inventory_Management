import { supabase } from "../../lib/supabaseClient";

export default async function handler(request, response) {
  console.log("API called:", request.method);
  console.log("Payload:", request.body);

  if (request.method !== "POST") {
    return response.status(405).json({ message: "Invalid" });
  }

  const {
    productDescription,
    location,
    lotNumber,
    amount,
    processId,
    jobType,
  } = request.body || {};

  const requiredFields = {
    productDescription,
    location,
    lotNumber,
    amount,
    processId,
    jobType,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (typeof value !== "string" || value.trim() === "") {
      console.error(`Validation error: "${key}" is missing or empty`);
      return response
        .status(400)
        .json({ message: `Field "${key}" is required` });
    }
  }

  // --- Amount must be numeric ---
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    console.error("Validation error: amount is not a valid number");
    return response
      .status(400)
      .json({ message: "Amount must be a valid number" });
  }

  // --- Insert into Supabase ---
  const { data, error } = await supabase.from("create_job").insert([
    {
      product_description: productDescription.trim(),
      location: location.trim(),
      lot_number: lotNumber.trim(), 
      amount: numericAmount,       
      process_id: processId.trim(),
      job_type: jobType.trim(),
    },
  ]);

  console.log("Supabase response:", { data, error });

  if (error) {
    return response
      .status(500)
      .json({ message: "Failed", error: error.message });
  }

  return response.status(200).json({ message: "Success", data });
}
