import React from "react";
//import "../App.css";
import Layout from "../components/layout";
import CleanStorageCard from "../components/CleanStorageCard";

function cleanStorage() {
    const data = [
        {
            location: "Refrigerator",
            rows: [{ lot: "24L5P2", processId: "2456", product: "YC", amount: "3,210", date: "12/12/2024" },
                { lot: "24F3", processId: "2273", product: "SWW", amount: "2,482", date: "12/13/2024" },
                { lot: "24P5", processId: "2543", product: "DRK", amount: "2,673", date: "12/14/2024" },
            ],
        },
        {
            location: "Inside Co2",
            rows: [{ lot: "24H3", processId: "2536", product: "WC", amount: "2,000", date: "12/12/2024" },
                { lot: "24E3", processId: "2374", product: "TRIT-V", amount: "2,482", date: "12/13/2024" },
                { lot: "24G5J3", processId: "2673", product: "RPC", amount: "2,673", date: "12/14/2024" },
            ],
        },
        {
            location: "Refer Trailer",
            rows: [{ lot: "24H5J2", processId: "2536", product: "WC", amount: "2,000", date: "12/12/2024" },
                { lot: "24D3", processId: "2374", product: "TRIT-V", amount: "2,482", date: "12/13/2024" },
                { lot: "24H5J3", processId: "2673", product: "RPC", amount: "2,673", date: "12/14/2024" },
            ],
        },
    ];
    return (
        <Layout title="Clean Storage">
            <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">
                <span>
                    <div className="min-h-screen flex flex-col items-center py-8 border-black" >
                        {data.map((locationData, idx) => (
                        <CleanStorageCard key={idx} {...locationData} />
                        ))}
                    </div>
                </span>
            </div>
        </Layout>
    );
}

export default cleanStorage;