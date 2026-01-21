import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { AlertCircle, Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export function FeatureLimitBanner() {
  const { access, hasReachedLimit, getLimitInfo } = useFeatureAccess();

  if (!access || access.plan !== "free") return null;

  const projectLimit = hasReachedLimit('projects');
  const keywordLimit = hasReachedLimit('keywords');
  const articleLimit = hasReachedLimit('articles');

  const reachedAnyLimit = projectLimit || keywordLimit || articleLimit;

  if (!reachedAnyLimit) return null;

  const projectInfo = getLimitInfo('projects');
  const keywordInfo = getLimitInfo('keywords');
  const articleInfo = getLimitInfo('articles');

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-5 mb-6 shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div className="bg-yellow-500 rounded-full p-2">
            <Lock className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-yellow-900 mb-2 text-lg">
            Plan Limit Reached
          </h4>
          <p className="text-sm text-yellow-800 mb-3">
            You've reached the limits of your free plan. Upgrade to continue creating.
          </p>
          
          {/* Usage Details */}
          <div className="space-y-2 mb-4">
            {projectLimit && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800">Projects:</span>
                <span className="font-semibold text-yellow-900">
                  {projectInfo.current}/{projectInfo.max}
                </span>
              </div>
            )}
            {keywordLimit && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800">Keywords:</span>
                <span className="font-semibold text-yellow-900">
                  {keywordInfo.current}/{keywordInfo.max}
                </span>
              </div>
            )}
            {articleLimit && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800">Articles this month:</span>
                <span className="font-semibold text-yellow-900">
                  {articleInfo.current}/{articleInfo.max}
                </span>
              </div>
            )}
          </div>

          <Link 
            to="/pricing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
