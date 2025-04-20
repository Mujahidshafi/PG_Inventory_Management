import React, { useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";

function CreateJob() {
  const [fields, setFields] = useState({
    productDescription: "",
    location: "",
    lotNumber: "",
    amount: "",
    processId: "",
    jobType: "",
  });

  const handleChange = (e, key) => {
    setFields({ ...fields, [key]: e.target.value });
  };

  const fieldLabels = [
    { key: "productDescription", label: "Product Description" },
    { key: "location", label: "Location" },
    { key: "lotNumber", label: "Lot Number" },
    { key: "amount", label: "Amount" },
    { key: "processId", label: "Process ID" },
    { key: "jobType", label: "Job Type" },
  ];

  return (
    <Layout title="New Field Run">
      <div className="w-full px-8 flex flex-col items-center">
        
        {/* Input fields container */}
        <div className="flex flex-wrap justify-between w-full max-w-5xl mb-8">
          {fieldLabels.map(({ key, label }) => (
            <div key={key} className="flex flex-col w-[30%] min-w-[200px] mb-4">
              <span className="mb-1 font-medium text-gray-700">{label}</span>
              <input
                type="text"
                value={fields[key]}
                onChange={(e) => handleChange(e, key)}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="px-2 py-1 border border-gray-400 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
  
        {/* Centered Button */}
        <div className="flex justify-center">
          <Button label="Save" color="red" />
        </div>
  
      </div>
    </Layout>
  );
}

export default CreateJob;
