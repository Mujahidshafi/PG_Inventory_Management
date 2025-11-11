import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient";

export default function InProcess() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;
  const [startingId, setStartingId] = useState(null);

  // SQL
  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("create_job") // FROM create_job
      .select("*") // SELECT *
      .eq("is_running", true) // WHERE is_running = TRUE
      .eq("is_complete", false) // WHERE is_complete = FALSE
      .order("date_created", { ascending: false }); // ORDER BY date_created DESC

    if (error) {
      console.error("Error fetching jobs:", error.message);
    } else {
      setJobs(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Page Logic
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  const handleCompleteJob = async (processId) => {
    try {
      setStartingId(processId);
      const res = await fetch("/api/inProcessBackend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Failed to complete job:", body?.message || res.statusText);
      } else {
        // refresh to remove completed job from this list
        await fetchJobs();
      }
    } catch (e) {
      console.error("Error completing job:", e);
    } finally {
      setStartingId(null);
    }
  };

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
      title="In Process Jobs"
      showBack={true}
      onSettingsClick={() => console.log("Settings clicked")}
    >
      {/* Outer gray rounded container */}
      <div className="w-full h-full flex flex-col justify-start transform mt-4">
        {loading ? (
          <p className="text-gray-600 text-center py-10">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-600 py-20">
            <p className="text-lg font-medium">No jobs running at the moment.</p>
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

                    <div className="flex flex-col w-[18%]">
                      <span className="font-semibold text-sm text-gray-700">Product Description</span>
                      <span className="mt-1">{job.product_description || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[15%]">
                      <span className="font-semibold text-sm text-gray-700">Location</span>
                      <span className="mt-1">{job.location || "N/A"}</span>
                    </div>

                    <div className="flex flex-col w-[13%]">
                      <span className="font-semibold text-sm text-gray-700">Amount</span>
                      <span className="mt-1">
                        {job.amount ? `${Number(job.amount).toLocaleString()} lbs` : "N/A"}
                      </span>
                    </div>

                    <div className="flex flex-col w-[18%]">
                      <span className="font-semibold text-sm text-gray-700">Date Created</span>
                      <span className="mt-1">
                        {job.date_created
                          ? new Date(job.date_created).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={startingId === job.process_id}
                    className={`${
                      startingId === job.process_id
                        ? "bg-gray-400 text-white cursor-wait"
                        : "bg-[#5D1214] text-white hover:bg-red-950"
                    } px-5 py-1.5 rounded-full transition font-medium ml-4`}
                    onClick={() => handleCompleteJob(job.process_id)}
                  >
                    {startingId === job.process_id ? "Completing..." : "Complete"}
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
