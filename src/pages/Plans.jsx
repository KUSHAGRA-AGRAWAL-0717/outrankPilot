import PlanMatrix from "../components/PlanMatrix";
import ProtectedRoute from "../components/ProtectedRoute";

export default function PlansPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-4xl mx-auto bg-white text-black rounded-lg shadow-md my-12">
        <h1 className="text-2xl font-bold mb-6">Choose Your Plan</h1>
        <PlanMatrix />
      </div>
    </ProtectedRoute>
  );
}
