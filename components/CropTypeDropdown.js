import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

//type Crop = { id: string; name: string }
//problem
//export default function CropTypeDropdown({ onChange }: { onChange?: (value: string) => void }) {
export default function CropTypeDropdown({ onChange }) {
  //const [crops, setCrops] = useState<Crop[]>([])
  //const [loading, setLoading] = useState(true)
  const [crops, setCrops] = useState([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("crop_types")
        .select("id, name")
        .order("name")

      if (error) {
        console.error("Error fetching crops:", error.message)
      } else {
        setCrops(data ?? [])
      }

      setLoading(false)
    }

    fetchCrops()
  }, [])

  return (
    <select
      onChange={(e) => onChange?.(e.target.value)}
      disabled={loading}
      style={{ padding: "6px 10px", margin: "8px 0" }}
    >
      <option value="">{loading ? "Loading..." : "Select crop type"}</option>
      {crops.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
