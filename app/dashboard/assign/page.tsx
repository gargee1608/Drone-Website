export const metadata = {
  title: "AEROLAMINAR | Assign Pilot or Drone",
  description: "Assign pilots and drones to missions from the command center.",
};

export default function AssignPilotDronePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-[#191c1d] sm:text-3xl">
        Assign Pilot or Drone
      </h1>
      <p className="text-sm leading-relaxed text-[#4d5b7f]">
        Use this area to match available pilots and drones to missions. Detailed
        assignment tools can be connected here.
      </p>
    </div>
  );
}
