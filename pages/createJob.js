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

  const handleSubmit = async () => {
    try {
      const payload = { ...fields };

      const res = await fetch("/api/createJobBackend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("Create Job Save");
        setFields({
          productDescription: "",
          location: "",
          lotNumber: "",
          amount: "",
          processId: "",
          jobType: "",
        });
      } else {
        console.error("Failed to save Job");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fieldLabels = [
    { key: "productDescription", label: "Product Description", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "lotNumber", label: "Lot Number", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "processId", label: "Process ID", type: "text" },
  ];

  const jobTypes = ["Qsage", "Sortex", "Bagging", "Order Fulfillment"];

  return (
    <Layout
      title="Create Job"
      showBack={true}
      onSettingsClick={() => console.log(" ")}
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

          {/* Job Type Dropdown */}
          <div className="flex flex-col">
            <label
              htmlFor="jobType"
              className="block text-center mb-2"
            >
              Job Type
            </label>
            <select 
              id="jobType"
              value={fields.jobType}
              onChange={(e) => handleChange("jobType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">Select job type</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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

export default CreateJob;

