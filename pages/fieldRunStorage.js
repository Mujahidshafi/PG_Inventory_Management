import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import FRStorageLayout from "../components/fRStorageLayout";

function fieldRunStorage() {
  return (
    <Layout title="Field Run Storage">
      <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">

        <FRStorageLayout title="HQ - 01"></FRStorageLayout>
        <FRStorageLayout title="HQ - 02"></FRStorageLayout>
        <FRStorageLayout title="HQ - 03"></FRStorageLayout>
        <FRStorageLayout title="HQ - 04"></FRStorageLayout>
        <FRStorageLayout title="HQ - 05"></FRStorageLayout>
        <FRStorageLayout title="HQ - 06"></FRStorageLayout>
        <FRStorageLayout title="HQ - 07"></FRStorageLayout>
        <FRStorageLayout title="HQ - 08"></FRStorageLayout>
        <FRStorageLayout title="HQ - 09"></FRStorageLayout>
        <FRStorageLayout title="HQ - 10"></FRStorageLayout>
        <FRStorageLayout title="HQ - 11"></FRStorageLayout>
        <FRStorageLayout title="HQ - 12"></FRStorageLayout>
        <FRStorageLayout title="HQ - 13"></FRStorageLayout>
        <FRStorageLayout title="HQ - 14"></FRStorageLayout>
        <FRStorageLayout title="HQ - 15"></FRStorageLayout>
        <FRStorageLayout title="HQ - 16"></FRStorageLayout>
        <FRStorageLayout title="HQ - 17"></FRStorageLayout>
        <FRStorageLayout title="HQ - 18"></FRStorageLayout>

        <FRStorageLayout title="BEN - 05"></FRStorageLayout>
        <FRStorageLayout title="BEN - 06"></FRStorageLayout>
        <FRStorageLayout title="BEN - 07"></FRStorageLayout>
        <FRStorageLayout title="BEN - 08"></FRStorageLayout>
        <FRStorageLayout title="BEN - 09"></FRStorageLayout>
        <FRStorageLayout title="BEN - 10"></FRStorageLayout>
        <FRStorageLayout title="BEN - 11"></FRStorageLayout>
        <FRStorageLayout title="BEN - 12"></FRStorageLayout>

        <FRStorageLayout title="Boxes - Mill"></FRStorageLayout>

        <FRStorageLayout title="CO2 - 1"></FRStorageLayout>
        <FRStorageLayout title="CO2 - 2"></FRStorageLayout>
  
      </div>
    </Layout>
  );
}

export default fieldRunStorage;