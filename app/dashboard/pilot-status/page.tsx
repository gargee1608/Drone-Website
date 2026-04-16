export const metadata = {
  title: "Drone Hire | Pilot Status",
  description:
    "Monitor pilot readiness, certifications, and operational availability.",
};

export default function PilotStatusPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[#191c1d] sm:text-3xl">
        Pilot Status
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
        View pilot availability, active certifications, and readiness indicators
        before assignment.
      </p>
    </section>
  );
}
