import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Link } from 'react-router-dom';

interface NewProjectProps {
  onProjectCreated?: (projectId: string) => void;
  onboardingMode?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  loading?: boolean;
}

export default function NewProject({ 
  onProjectCreated, 
  onboardingMode = false, 
  onLoadingChange,
  loading: propLoading 
}: NewProjectProps) {
  const navigate = useNavigate();
  const { user, refreshProjects, setCurrentProject } = useApp();
  const { access, canCreate, hasReachedLimit, getLimitInfo } = useFeatureAccess();
  const [name, setName] = useState('');
  const [business_url, setBusinessUrl] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  const isLoading = propLoading || localLoading;
  const projectLimit = getLimitInfo('projects');
  const canCreateProject = canCreate('projects');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (!business_url.trim()) {
      toast.error('Please enter a business URL');
      return;
    }

    // Check project limit
    if (!canCreateProject) {
      toast.error(`You've reached your project limit (${projectLimit.current}/${projectLimit.max}). Please upgrade your plan.`, {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    setLocalLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const cleanBusinessUrl = business_url.trim().replace(/^https?:\/\//, '');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: name.trim(),
          business_url: cleanBusinessUrl || null,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (onProjectCreated && onboardingMode) {
        onProjectCreated(data.id);
        return;
      }

      await refreshProjects();
      setCurrentProject({
        id: data.id,
        name: data.name,
        business_url: data.business_url || '',
        createdAt: new Date(data.created_at),
        keywords: 0,
        briefs: 0,
      });

      toast.success('Project created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setLocalLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  // Form content component
  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Limit Warning */}
      {access && hasReachedLimit('projects') && (
        <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                Project Limit Reached
              </p>
              <p className="text-xs text-yellow-800 mb-2">
                You've used {projectLimit.current} of {projectLimit.max} projects on your {access.plan} plan.
              </p>
              <Link 
                to="/pricing"
                className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-800"
              >
                <Crown className="h-3 w-3" />
                Upgrade to add more projects →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Project Usage Info */}
      {access && !hasReachedLimit('projects') && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-900 font-medium">
              Projects: {projectLimit.current}/{projectLimit.isUnlimited ? '∞' : projectLimit.max}
            </span>
            {access.plan === "free" && (
              <Link 
                to="/pricing"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Upgrade for more →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#0B1F3B]">
          Project Name <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="My Awesome Blog"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading || hasReachedLimit('projects')}
          className="h-12 bg-white border-2 border-[#E5E7EB] focus:border-[#1B64F2] focus:ring-2 focus:ring-[#1B64F2]/20 text-[#0B1F3B] placeholder:text-[#8A94B3] disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#0B1F3B]">
          Business Website <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="https://www.myawesomeblog.com"
          value={business_url}
          onChange={(e) => setBusinessUrl(e.target.value)}
          required
          disabled={isLoading || hasReachedLimit('projects')}
          className="h-12 bg-white border-2 border-[#E5E7EB] focus:border-[#1B64F2] focus:ring-2 focus:ring-[#1B64F2]/20 text-[#0B1F3B] placeholder:text-[#8A94B3] disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-[#5B6B8A] mt-1">
          Enter your full business URL including http:// or https://
        </p>
      </div>

      <div className="rounded-xl border-2 border-[#E5E7EB] bg-gradient-to-br from-[#F6F8FC] to-white p-6">
        <h3 className="font-semibold text-[#0B1F3B] mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#1B64F2]" />
          What you'll get:
        </h3>
        <ul className="space-y-3">
          {[
            'Keyword research and tracking',
            'AI-powered content brief generation',
            'SERP analysis and competitor insights',
            'One-click WordPress publishing',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[#5B6B8A]">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button 
        type="submit" 
        size="lg" 
        className={`w-full h-13 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
          hasReachedLimit('projects')
            ? 'bg-gray-400 cursor-not-allowed'
            : onboardingMode 
            ? 'bg-gradient-to-r from-[#1B64F2] to-[#1246C9] hover:from-[#1246C9] hover:to-[#0F3BA0] text-white' 
            : 'bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B]'
        }`}
        disabled={isLoading || hasReachedLimit('projects')}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Creating Project...</span>
          </div>
        ) : hasReachedLimit('projects') ? (
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Upgrade to Create More Projects</span>
          </div>
        ) : (
          <span>{onboardingMode ? 'Create Project & Continue →' : 'Create Project'}</span>
        )}
      </Button>

      {hasReachedLimit('projects') && (
        <div className="text-center">
          <Link 
            to="/pricing"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            View pricing plans →
          </Link>
        </div>
      )}
    </form>
  );

  // If onboarding mode, return just the form
  if (onboardingMode) {
    return (
      <div className="w-full">
        <FormContent />
      </div>
    );
  }

  // For regular dashboard mode, return with full page layout
  return (
    <div className="min-h-screen bg-[#F6F8FC] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost"
          className="gap-2 text-[#5B6B8A] hover:text-[#0B1F3B] hover:bg-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Main Card */}
        <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-[#E5E7EB]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B64F2] to-[#3EF0C1] shadow-lg">
              <Globe className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3B]">Add New Project</h1>
              <p className="text-[#5B6B8A]">Connect your site to start creating content</p>
            </div>
          </div>

          {/* Form */}
          <FormContent />
        </div>
      </div>
    </div>
  );
}
