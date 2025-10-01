import React from 'react';
import { useRouter } from 'next/router';

const jobs = [
  {
    jobType: 'Mill',
    lotNumber: '24J1',
    processId: '2870',
    description: 'YPC',
    location: 'HQ-6',
    amount: '50,000 lbs',
  },
  {
    jobType: 'Bagging',
    lotNumber: '24B3',
    processId: '2871',
    description: 'DRK',
    location: 'Refrigerator',
    amount: '30,000 lbs',
  },
];

export default function MillJobs() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          className="bg-green-900 text-white px-4 py-2 rounded-full"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-800">Mill Jobs</h1>
        <div className="flex gap-3 text-2xl">
          {/* Replace with icons from lucide-react or react-icons if needed */}
          <span role="img" aria-label="bell">🔔</span>
          <span role="img" aria-label="settings">⚙️</span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-gray-200 p-6 rounded-xl">
        {jobs.map((job, index) => (
          <div
            key={index}
            className="flex flex-wrap justify-between items-center bg-white border rounded-md p-4 mb-4 shadow-sm"
          >
            <p className="text-gray-800 font-medium">
              <strong>Job Type</strong><br />{job.jobType}
            </p>
            <p className="text-gray-800 font-medium">
              <strong>Lot Number</strong><br />{job.lotNumber}
            </p>
            <p className="text-gray-800 font-medium">
              <strong>Process ID</strong><br />{job.processId}
            </p>
            <p className="text-gray-800 font-medium">
              <strong>Product Description</strong><br />{job.description}
            </p>
            <p className="text-gray-800 font-medium">
              <strong>Location</strong><br />{job.location}
            </p>
            <p className="text-gray-800 font-medium">
              <strong>Amount</strong><br />{job.amount}
            </p>
            <button
              className="bg-[#6B0000] text-white px-4 py-2 rounded-full hover:bg-[#510000] transition"
              onClick={() => router.push(`/runJob/${job.processId}`)}
            >
              Run
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
