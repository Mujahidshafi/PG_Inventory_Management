import React, { useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";

function NewFieldRun() {
  const [fields, setFields] = useState({
    field1: "",
    field2: "",
    field3: "",
    field4: "",
    field5: "",
    field6: "",
  });

  const handleChange = (e, key) => {
    setFields({ ...fields, [key]: e.target.value });
  };

  return (
    <Layout title="New Field Run">
      <div className="w-full px-8 flex flex-col items-center">
        
        {/* Input fields container */}
        <div className="flex flex-wrap justify-between w-full max-w-5xl mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col w-[30%] min-w-[200px] mb-4">
              <span className="mb-1 font-medium text-gray-700">Field Lot Number</span>
              <input
                type="text"
                value={fields[`field${i}`]}
                onChange={(e) => handleChange(e, `field${i}`)}
                placeholder={`Enter value ${i}`}
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

export default NewFieldRun;
