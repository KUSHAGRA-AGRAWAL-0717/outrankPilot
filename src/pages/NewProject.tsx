import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
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

export default function NewProject() {
  const navigate = useNavigate();
  const { user, refreshProjects, setCurrentProject } = useApp();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    setLoading(true);

    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: name.trim(),
          domain: cleanDomain || null,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      await refreshProjects();
      
      setCurrentProject({
        id: data.id,
        name: data.name,
        domain: data.domain || '',
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
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 bg-[#F6F8FC] min-h-screen p-6">
        <Button 
          className="gap-2 bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="rounded-xl border border-[#8A94B3]/30 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1B64F2]/10">
              <Globe className="h-7 w-7 text-[#1B64F2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F3B]">Add New Project</h1>
              <p className="text-[#5B6B8A]">Connect your WordPress site to start creating content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0B1F3B]">Project Name</label>
              <Input
                placeholder="My Awesome Blog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0B1F3B]">Domain (optional)</label>
              <Input
                placeholder="myawesomeblog.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-12 border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2]"
              />
              <p className="text-xs text-[#8A94B3]">
                Enter your website domain without http:// or https://
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
              className="w-full bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}