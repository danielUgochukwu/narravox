import { PricingTable } from "@clerk/nextjs";

const Page = () => {
  return (
    <main className="clerk-subscriptions">
      <section className="w-full max-w-4xl text-center">
        <h1 className="page-title-xl">Subscriptions</h1>
        <p className="subtitle mt-3">
          Choose the plan that fits your reading flow.
        </p>
      </section>

      <div className="clerk-pricing-table-wrapper w-full">
        <PricingTable />
      </div>
    </main>
  );
};

export default Page;
