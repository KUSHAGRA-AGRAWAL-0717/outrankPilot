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
      
      // Set the new project as current
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
      <div className="max-w-2xl mx-auto space-y-6 dark">
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add New Project</h1>
              <p className="text-muted-foreground">Connect your WordPress site to start creating content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Name</label>
              <Input
                placeholder="My Awesome Blog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Domain (optional)</label>
              <Input
                placeholder="myawesomeblog.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your website domain without http:// or https://
              </p>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <h3 className="font-medium text-foreground mb-3">What you'll get:</h3>
              <ul className="space-y-2">
                {[
                  'Keyword research and tracking',
                  'AI-powered content brief generation',
                  'SERP analysis and competitor insights',
                  'One-click WordPress publishing',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full"
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
