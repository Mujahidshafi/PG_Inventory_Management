import React from "react";
import Layout from "../components/layout";
import ProcessCard from "../components/InProcessCard";
const jobData = [
    {jobType: "Mill", lot: "241", processId: "2870", product: "YPC", location: "HQ-6", amount: "50,000 lbs",},
    {jobType: "Mill", lot: "242", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "243", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "244", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "245", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "246", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "247", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "248", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "249", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
    {jobType: "Mill", lot: "250", processId: "2871", product: "ABC", location: "HQ-7", amount: "40,000 lbs",},
];
function inProcess() {
    return (
        <Layout title="In Process">
            <div className="flex flex-col w-full h-full">
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="grid gap-6">
                        {jobData.map((job, index) => (
                            <ProcessCard key={index} data={job}/>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
);
}

export default inProcess;