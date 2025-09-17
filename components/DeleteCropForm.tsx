import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

type Crop = { id: string; name: string }

export default function DeleteCropForm() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [selected, setSelected] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchCrops = async () => {
      const { data, error } = await supabase
        .from("crop_types")
        .select("id, name")
        .order("name")

      if (error) {
        console.error(error.message)
      } else {
        setCrops(data ?? [])
      }
    }

    fetchCrops()
  }, [])

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return

    const { error } = await supabase.from("crop_types").delete().eq("id", selected)

    if (error) {
      console.error(error.message)
      setMessage("❌ Error deleting crop")
    } else {
      setMessage("✅ Crop deleted")
      setCrops(crops.filter((c) => c.id !== selected))
      setSelected("")
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ padding: "6px", marginRight: "8px" }}
      >
        <option value="">Select crop to delete</option>
        {crops.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!selected}>
        Delete
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}
