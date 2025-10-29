import CropTypeDropdown from "../components/CropTypeDropdown"
import AddCropForm from "../components/AddCropForm"
import DeleteCropForm from "../components/DeleteCropForm"
import { useState } from "react";

export default function TestCropsPage() {
  const [selectedCrop, setSelectedCrop] = useState("");
  return (
    <main style={{ padding: 24 }}>
      <h1>Crop Types Management</h1>

      <h2>Add Crop</h2>
      <AddCropForm />

      <h2>Delete Crop</h2>
      <DeleteCropForm />

      <h2>Choose a Crop (Dropdown)</h2>
      <CropTypeDropdown value={selectedCrop} onChange={(val) => console.log("Selected:", val)} />
    </main>
  )
}
