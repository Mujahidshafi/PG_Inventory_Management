import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const{lot = "", product ="", supplier = ""} = (req.body ?? {});
    let query = supabase.from("clean_product_storage").select("*").order("Date_Stored", { ascending: false });
    if(typeof lot === "string" && lot.trim()){
      query = query.ilike("Lot_Number", `%${lot.trim()}%`);
    }
    if(typeof product === "string" && product.trim()){
      query = query.ilike("Product", `%${product.trim()}%`);
    }
    /*if(typeof supplier === "string" && supplier.trim()){
      query = query.ilike("Supplier", `%${supplier.trim()}%`);
    }*/
    if(typeof supplier === "string"){
      if(supplier === "_NULL_"){
        query = query.or("Supplier.is.null,Supplier.eq.");
      } else if(supplier.trim()){
        query = query.ilike("Supplier", `%${supplier.trim()}%`);
      }
    }
    
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === "GET") {
    const { id } = req.query;
    try {
      if (id) {
        const { data, error } = await supabase
          .from("clean_product_storage")
          .select("*")
          .eq("ID", id)
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from("clean_product_storage")
          .select("*");

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
    } catch (e) {
      console.error("GET error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }
  if (req.method === "PUT") {
    const { id } = req.query;
    const body = req.body;

    if (!id) return res.status(400).json({ error: "Missing id" });

    const { error } = await supabase
      .from("clean_product_storage")
      .update(body)
      .eq("ID", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const { error } = await supabase
      .from("clean_product_storage")
      .delete()
      .eq("ID", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ message: "Method not allowed" });
}
