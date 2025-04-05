import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import Button from "../components/button";

function employeeMenu() {
    return (
      <Layout title="Employee Menu">
        <div class = "flex flex-wrap justify-center items-center w-[100%] h-[100%]"> 
            <div class = "grid gap-4 lg: grid-cols-2 lg: grid-rows-2 lg: gap-20">
            <Button
            label = "New Field Run"
            color = "red"
            className = "min-w-[160px] h-16"
            />
            <Button
            label = "Transfer"
            color = "red"
            className = "min-w-[160px] h-16"
            />
            <Button
            label = "Mill Job"
            color = "red"
            className = "min-w-[160px] h-16"
            />
            <Button
            label = "Update Location"
            color = "red"
            className = "min-w-[160px] h-16"
            />
            </div>
        </div>
      </Layout>
    );
  }

export default employeeMenu;