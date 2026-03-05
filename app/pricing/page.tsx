import React from "react";
import {PricingTable} from "@clerk/nextjs";

const Page = () => {
  return (
    <div>PricingPage
      <PricingTable newSubscriptionRedirectUrl="/dashboard/" />
    </div>
  );
};
export default Page;
