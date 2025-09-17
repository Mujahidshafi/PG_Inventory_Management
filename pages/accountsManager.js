import React from "react";
import Button from "../components/button"; 
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/layout";

function accountsManager() {
  return (
    <Layout title="Accounts Manager">
      <Link href="/createAccount">
            <Button 
              label="Create New User"
              color="red"
              className="w-[120px] h-[45px] font-[amiri] items-center my-6"
            />
      </Link>
    </Layout>
  );
}

export default accountsManager;