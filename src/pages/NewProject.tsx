import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewProjectProps {
  onProjectCreated?: (projectId: string) => void;
  onboardingMode?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export default function NewProject({ 
  onProjectCreated, 
  onboardingMode = false, 
  onLoadingChange,
  loading: propLoading 
}: NewProjectProps) {
  const navigate = useNavigate();
  const { user, refreshProjects, setCurrentProject } = useApp();
  const [name, setName] = useState('');
  const [business_url, setBusinessUrl] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [loading,setLoading] = useState(false);
const isLoading = propLoading || localLoading

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

  if (!user) {
    toast.error('You must be logged in to create a project');
    return;
  }

  setLoading(true);

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

    // Call onboarding callback FIRST if in onboarding mode
    if (onProjectCreated && onboardingMode) {
      onProjectCreated(data.id);
      return; // Don't navigate - let onboarding handle it
    }

    // Regular dashboard flow
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
    setLoading(false);
  }
};


  return (
  
      <div className="max-w-2xl mx-auto space-y-6 bg-[#F6F8FC] min-h-screen p-6">
        {/* <Button 
          className="gap-2 bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button> */}

        <div className="rounded-xl border border-[#8A94B3]/30 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1B64F2]/10">
              <Globe className="h-7 w-7 text-[#1B64F2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3B]">Add New Project</h1>
              <p className="text-[#5B6B8A]">Connect your site to start creating content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Project Name</label>
              <Input
                placeholder="My Awesome Blog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Business Name</label>
              <Input
                placeholder="https://www.myawesomeblog.com"
                value={business_url}
                onChange={(e) => setBusinessUrl(e.target.value)}
                className="h-12 border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2] text-white"
              />
              <p className="text-xs text-[#8A94B3]">
                Enter your full business URL including http:// or https://
              </p>
            </div>

            <div className="rounded-lg border border-[#8A94B3]/30 bg-[#F6F8FC] p-4">
              <h3 className="font-medium text-[#0B1F3B] mb-3">What you'll get:</h3>
              <ul className="space-y-2">
                {[
                  'Keyword research and tracking',
                  'AI-powered content brief generation',
                  'SERP analysis and competitor insights',
                  'One-click WordPress publishing',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#5B6B8A]">
                    <CheckCircle2 className="h-4 w-4 text-[#3EF0C1]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          <Button 
  type="submit" 
  size="lg" 
  className={`w-full h-12 font-semibold shadow-xl transition-all duration-300 ${
    onboardingMode 
      ? 'bg-gradient-to-r from-[#1B64F2] to-[#3EF0C1] hover:from-[#1B64F2]/90 hover:to-[#3EF0C1]/90 text-white' 
      : 'bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B]'
  }`}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      {onboardingMode ? 'Creating Project...' : 'Creating Project...'}
    </>
  ) : (
    onboardingMode ? 'Create Project & Continue →' : 'Create Project'
  )}
</Button>

          </form>
        </div>
      </div>
  );
}