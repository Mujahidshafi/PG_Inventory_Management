import React, { useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import TextFields from "../components/textFields";

function NewFieldRun() {
  const [fields, setFields] = useState({
    field1: "",
    field2: "",
    field3: "",
    field4: "",
    field5: "",
  });
  
  const [dateTime, setDateTime] = useState("");

  const handleChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...fields, dateTime }; 

      const res = await fetch("/api/fieldruns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("Field run saved!");
        setFields({
          field1: "",
          field2: "",
          field3: "",
          field4: "",
          field5: "",
        });
        setDateTime("");
      } else {
        console.error("Failed to save field run");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fieldLabels = [
    { key: "field1", label: "Field Lot Number", type: "text" },
    { key: "field2", label: "Product Description", type: "text" },
    { key: "field3", label: "Weight", type: "text" },
    { key: "field4", label: "Moisture", type: "text" },
    { key: "field5", label: "Location", type: "text" },
  ];

  return (
    <Layout
      title="New Field Run"
      showBack={true}
      onSettingsClick={() => console.log(" ")}
    >
      <div className="w-full px-8 flex flex-col items-center">
        <div className="grid grid-cols-3 gap-6 w-full max-w-5xl mb-8">
          {fieldLabels.map(({ key, label, type }) => (
            <TextFields
              key={key}
              id={key}
              label={label}
              type={type}
              value={fields[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ))}

          {/*Date & Time*/}
          <div className="flex flex-col">
            <label htmlFor="dateTime" className="mb-1 text-black">
              Date & Time
            </label>
            <input
              id="dateTime"
              className="border p-2 rounded border-gray-400 text-black"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button label="Save" color="red" onClick={handleSubmit} />
        </div>
      </div>
    </Layout>
  );
}

export default NewFieldRun;
