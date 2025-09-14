import React, { useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import TextFields from "../components/textFields";

function CreateJob() {
  const [fields, setFields] = useState({
    productDescription: "",
    location: "",
    lotNumber: "",
    amount: "",
    processId: "",
    jobType: "",
  });

  const handleChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  const fieldLabels = [
    { key: "productDescription", label: "Product Description", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "lotNumber", label: "Lot Number", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "processId", label: "Process ID", type: "text" },
    { key: "jobType", label: "Job Type", type: "text" },
  ];

  return (
    <Layout title="Create Job" showBack={true} onSettingsClick={() => console.log(" ")}
    >
      <div className="w-full px-8 flex flex-col items-center">
        {/* Input fields */}
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
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button label="Save" color="red" />
        </div>
      </div>
    </Layout>
  );
}

export default CreateJob;
