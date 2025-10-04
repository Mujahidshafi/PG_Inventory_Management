import React from "react";
import Layout from "../components/layout"; 
import Link from "next/link"

const buttonStyle="bg-[#5D1214] text-white px-6 py-6 rounded-[15px] text-lg font-semibold text-center hover:bg-[#3D5147] transition-all duration-300"


function StorageDashboard() {
  return (
      <Layout title="Storage Dashboard">
        <div className= "grid grid-cols-3 gap-20">
        <Link href="/fieldRunStorage" className={buttonStyle}> Field Run Storage </Link>
        <Link href="/cleanStorage" className={buttonStyle}> Clean Storage </Link>
        <Link href="/screeningStorage" className={buttonStyle}> Screening Storage </Link>
         </div>
      </Layout>
  );
}

export default StorageDashboard;
