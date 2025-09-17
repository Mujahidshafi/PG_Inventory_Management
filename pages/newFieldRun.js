import React, { useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import TextFields from "../components/textFields";
import DateTimeField from "../components/dateTimeField";

function NewFieldRun() {
  const [fields, setFields] = useState({
    fieldLotNumber: "",
    productDescription: "",
    Weight: "",
    Moisture: "",
    Location: "",
  });
  
  const [dateTime, setDateTime] = useState("");

  const handleChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...fields, dateTime }; 

      const res = await fetch("/api/newFieldRunBackend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("Field Run Save");
        setFields({
          fieldLotNumber: "",
          productDescription: "",
          Weight: "",
          Moisture: "",
          Location: "",
        });
        setDateTime("");
      } else {
        console.error("Failed to save Field Run");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fieldLabels = [
    { key: "fieldLotNumber", label: "Field Lot Number", type: "text" },
    { key: "productDescription", label: "Product Description", type: "text" },
    { key: "Weight", label: "Weight", type: "text" },
    { key: "Moisture", label: "Moisture", type: "text" },
    { key: "Location", label: "Location", type: "text" },
  ];

  return (
    <Layout
      title="New Field Run"
      showBack={true}
      onSettingsClick={() => console.log(" ")}
    >
      <div className="w-full px-8 flex flex-col items-center">
        <div className="grid grid-cols-3 gap-28 w-full max-w-5xl mb-35">
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

          <DateTimeField
            value={dateTime}
            onChange={setDateTime}
          />
          
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