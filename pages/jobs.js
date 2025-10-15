import React, { useEffect, useState } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
      //SQL
        .from("create_job") //FROM create_job
        .select("*") //SELECT *
        .order("process_id", { ascending: false }); //ORDER BY process_id DESC

      if (error) {
        console.error("Error fetching jobs:", error.message);
      } else {
        setJobs(data);
      }

      setLoading(false);
    }

    fetchJobs();
  }, []);

  // Page Logic
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Page Buttons
  let prevButtonClasses = "px-4 py-2 rounded-md font-medium";
  if (currentPage === 1) {
    prevButtonClasses += " bg-gray-300 text-gray-600 cursor-not-allowed";
  } else {
    prevButtonClasses += " bg-[#3D5147] text-white hover:bg-[#2c3a35]";
  }

  let nextButtonClasses = "px-4 py-2 rounded-md font-medium";
  if (currentPage === totalPages) {
    nextButtonClasses += " bg-gray-300 text-gray-600 cursor-not-allowed";
  } else {
    nextButtonClasses += " bg-[#3D5147] text-white hover:bg-[#2c3a35]";
  }

  return (
    <Layout
      title="Jobs"
      showBack={true}
      onSettingsClick={() => console.log("Settings clicked")}
    >
      {/* Outer gray rounded container */}
      <div className="w-full h-full flex flex-col justify-start transform mt-4">
        {loading ? (
          <p className="text-gray-600 text-center py-10">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-600 py-20">
            <p className="text-lg font-medium">No jobs available at the moment.</p>
            <p className="text-sm mt-2">When new jobs are added, they’ll appear here.</p>
          </div>
        ) : (
          <>
            {/* Jobs List */}
            <div className="flex flex-col space-y-5">
              {currentJobs.map((job, index) => (
                <div
                  key={index}
                  className="flex flex-row justify-between items-center bg-white border border-gray-400 rounded-lg p-5 shadow-sm"
                >
                  <div className="flex flex-row justify-between text-gray-800 font-medium w-[90%]">
                    <div className="flex flex-col w-[12%]">
                      <span className="font-semibold text-sm text-gray-700">Job Type</span>
                      <span className="mt-1">{job.job_type || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[12%]">
                      <span className="font-semibold text-sm text-gray-700">Lot Number</span>
                      <span className="mt-1">{job.lot_number || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[12%]">
                      <span className="font-semibold text-sm text-gray-700">Process ID</span>
                      <span className="mt-1">{job.process_id || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[20%]">
                      <span className="font-semibold text-sm text-gray-700">Product Description</span>
                      <span className="mt-1">{job.product_description || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[20%]">
                      <span className="font-semibold text-sm text-gray-700">Location</span>
                      <span className="mt-1">{job.location || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[15%]">
                      <span className="font-semibold text-sm text-gray-700">Amount</span>
                      <span className="mt-1">
                        {job.amount ? `${Number(job.amount).toLocaleString()} lbs` : "N/A"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="bg-[#6B0000] text-white px-5 py-1.5 rounded-full hover:bg-[#510000] transition font-medium ml-4"
                    onClick={() => console.log(`Run job ${job.process_id}`)}
                  >
                    Run
                  </button>
                </div>
              ))}
            </div>

            {/* Page Controls */}
            <div className="flex justify-center items-center mt-6 space-x-4">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={prevButtonClasses}
              >
                Previous
              </button>

              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={nextButtonClasses}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
