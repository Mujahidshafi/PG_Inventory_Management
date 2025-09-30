import React from "react";
import Link from "next/link"; 
import Layout from "../components/layout";

const buttonStyle="bg-[#5D1214] text-white px-6 py-6 rounded-[15px] text-lg font-semibold text-center hover:bg-[#3D5147] transition-all duration-300"

function mix() {
  return (
    <Layout title="Mix">
      <div className="grid grid-cols-2 gap-8">
        <Link href="/twoToOne" className={buttonStyle}> Two to One </Link>

        <Link href="/threeToOne" className={buttonStyle}> Three to One </Link>

      </div>
    </Layout>
  );
};
export default mix;
