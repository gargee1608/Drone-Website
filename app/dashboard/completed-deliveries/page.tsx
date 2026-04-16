export const metadata = {
  title: "Drone Hire | Completed Deliveries",
  description:
    "Track finalized delivery missions and operational completion metrics.",
};

export default function CompletedDeliveriesPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#191c1d] sm:text-3xl">
        Completed Deliveries
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
        Review completed mission logs, delivery performance, and fulfillment
        summaries from the admin dashboard.
      </p>
    </section>
  );
}
