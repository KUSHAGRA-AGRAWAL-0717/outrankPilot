import { ReactNode } from "react";
import { Loader2, Check } from "lucide-react";

const STEPS = [
  { id: 0, title: "Create Project", shortTitle: "Project" },
  { id: 1, title: "Audience & Competitors", shortTitle: "Audience" },
  { id: 2, title: "Blogs & Articles", shortTitle: "Content" },
  { id: 3, title: "Integrations", shortTitle: "Connect" }
];

interface OnboardingLayoutProps {
  step: number;
  children: ReactNode;
  onPrev?: () => void;
  loading?: boolean;
}

export default function OnboardingLayout({ step, children, onPrev, loading = false }: OnboardingLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      {/* Horizontal Steps Header */}
      <div className="bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Mobile Back Button */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="lg:hidden mb-6 text-sm text-[#0B1F3B] hover:text-[#1B64F2] font-medium flex items-center gap-1"
            >
              ← Back
            </button>
          )}
          
          {/* Horizontal Step Indicators */}
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E5E7EB] -z-0">
              <div 
                className="h-full bg-[#1B64F2] transition-all duration-500"
                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  i < step 
                    ? 'bg-[#1B64F2] text-white shadow-lg' 
                    : i === step
                      ? 'bg-[#1B64F2] text-white shadow-lg ring-4 ring-[#1B64F2]/20'
                      : 'bg-white border-2 border-[#E5E7EB] text-[#8A94B3]'
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <div className="mt-3 text-center">
                  <div className={`text-xs font-semibold hidden sm:block ${
                    i <= step ? 'text-[#0B1F3B]' : 'text-[#8A94B3]'
                  }`}>
                    {s.shortTitle}
                  </div>
                  <div className={`text-[10px] mt-0.5 hidden md:block ${
                    i <= step ? 'text-[#5B6B8A]' : 'text-[#8A94B3]'
                  }`}>
                    {i < step ? 'Complete' : i === step ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Back Button */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="hidden lg:block mt-6 text-sm text-[#0B1F3B] hover:text-[#1B64F2] font-medium flex items-center gap-1"
            >
              ← Back to Previous Step
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {children}
      </div>
    </div>
  );
}