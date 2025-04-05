import React from "react";
import Link from "next/link"; 
import Layout from "../components/layout";

export default function AdminMenu() {
  const menuButton = [
    { name: "New Field Run", path: "/newFieldRun" },
    { name: "Transfer", path: "/transfer" },
    { name: "Add New Items", path: "/addNewItems" },
    { name: "Delete Items", path: "/deleteItems" },
    { name: "Mill Job", path: "/millJob" },
    { name: "Store", path: "/store" },
    { name: "Create Mill Job", path: "/createMillJob" },
    { name: "In Process", path: "/inProcess" },
    { name: "Storage Dashboard", path: "/storageDashboard" },
    { name: "Sale", path: "/sale" },
  ];

  return (
    <Layout title="Admin Menu">
      <div className="grid grid-cols-5 gap-8">
        {menuButton.map((button, index) => (
          <Link
            key={index}
            href={button.path}
            className="bg-[#5D1214] text-white px-6 py-4 rounded-[15px] text-lg font-semibold 
                       flex-1 text-center hover:bg-[#390B0EFF] transition-all duration-300"
          >
            {button.name}
          </Link>
        ))}
      </div>
    </Layout>
  );
}
