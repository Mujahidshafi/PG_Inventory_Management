import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 

function screeningStorage() {
    return (
      <Layout title="Screening Storage">
        <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">
            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
            </div>

            {/* this is the line where the first entry of screening storage ends.
               the rest is duplicated code of the first entry to demonstrate an example. */}

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>

            <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4">
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                Screening Shed
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                24J1
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                2734
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                Barley
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                2,000 lbs
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                12/12/2024
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
              
            </div>
          </div>

              
          
      </Layout>
    );
  }

export default screeningStorage;