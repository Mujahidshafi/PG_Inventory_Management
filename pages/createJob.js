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

  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  const handleSubmit = async () => {
    setError("");
    setShowModal(false);

    const requiredFields = [
      "productDescription",
      "location",
      "lotNumber",
      "amount",
      "processId",
      "jobType",
    ];

    for (const key of requiredFields) {
      if (!fields[key] || fields[key].trim() === "") {
        const message = `${key} cannot be empty.`;
        console.error(message);
        setError(message);
        setShowModal(true);
        return;
      }
    }

    try {
      const payload = { ...fields };
      console.log("CreateJob: sending payload:", payload);

      const res = await fetch("/api/createJobBackend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("CreateJob: response status:", res.status);

      if (res.status === 400) {
        const data = await res.json();
        console.log("CreateJob: 400 response body:", data);
        const message = data.message || "Please check your input.";
        setError(message);
        setShowModal(true);
        return;
      }

      if (!res.ok) {
        console.error("CreateJob: failed to save job");
        setError("Failed to save job.");
        setShowModal(true);
        return;
      }

      console.log("CreateJob: save success");
      setFields({
        productDescription: "",
        location: "",
        lotNumber: "",
        amount: "",
        processId: "",
        jobType: "",
      });
    } catch (err) {
      console.error("CreateJob: error during submit:", err);
      setError("Something went wrong.");
      setShowModal(true);
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
          
          <div className="flex flex-col">
            <label htmlFor="jobType" className="block text-center mb-2">
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

        <div className="flex justify-center">
          <Button label="Save" color="red" onClick={handleSubmit} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-transparent flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600 text-xl"
            >
              ×
            </button>
            <p className="text-red-600 text-center mb-6">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default CreateJob;
