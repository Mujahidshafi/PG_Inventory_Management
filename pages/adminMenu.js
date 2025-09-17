import React from "react";
import Link from "next/link"; 
import Layout from "../components/layout";

const buttonStyle="bg-[#5D1214] text-white px-6 py-6 rounded-[15px] text-lg font-semibold text-center hover:bg-[#3D5147] transition-all duration-300"

function adminMenu() {
  return (
    <Layout title="Admin Menu">
      <div className="grid grid-cols-4 gap-8">
        <Link href="/newFieldRun" className={buttonStyle}> New Field Run </Link>

        <Link href="/transfer" className={buttonStyle}> Transfer </Link>

        <Link href="/addNewItems" className={buttonStyle}> Add New Items </Link>

        <Link href="/deleteItems" className={buttonStyle}> Delete Items </Link>

        <Link href="/jobs" className={buttonStyle}> Jobs </Link>

        <Link href="/updateLocation" className={buttonStyle}> Update Location </Link>

        <Link href="/createJob" className={buttonStyle}> Create Job </Link>

        <Link href="/inProcess" className={buttonStyle}> In Process </Link>

        <Link href="/storageDashboard" className={buttonStyle}> Storage Dashboard </Link>

        <Link href="/sale" className={buttonStyle}> Sale </Link>

        <Link href="/search" className={buttonStyle}> Search </Link>

        <Link href="/accountsManager" className={buttonStyle}> Accounts Manager </Link>

      </div>
    </Layout>
  );
};
export default adminMenu;
