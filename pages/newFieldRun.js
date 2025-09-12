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
    field6: "",
  });

  const handleChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  // Define your fields (like CreateJob does)
  const fieldLabels = [
    { key: "field1", label: "Field Lot Number 1", type: "text" },
    { key: "field2", label: "Field Lot Number 2", type: "text" },
    { key: "field3", label: "Field Lot Number 3", type: "text" },
    { key: "field4", label: "Field Lot Number 4", type: "text" },
    { key: "field5", label: "Field Lot Number 5", type: "text" },
    { key: "field6", label: "Field Lot Number 6", type: "text" },
  ];

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/fieldruns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        console.log("Field run saved!");
        setFields({
          field1: "",
          field2: "",
          field3: "",
          field4: "",
          field5: "",
          field6: "",
        });
      } else {
        console.error("Failed to save field run");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <Layout title="New Field Run" showBack={true} onSettingsClick={() => console.log(" ")}>
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
