import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddCropForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (!cleaned) return;

    const { error } = await supabase.from("crop_types").insert([{ name: cleaned }]);

    if (error) {
      console.error(error.message);
      setMessage("❌ Error adding crop");
    } else {
      setMessage(`✅ Added crop: ${cleaned}`);
      setName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter crop name"
        style={{ padding: "6px", marginRight: "8px" }}
      />
      <button type="submit">Add Crop</button>
      {message && <p>{message}</p>}
    </form>
  );
}
