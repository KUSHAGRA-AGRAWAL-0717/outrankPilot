import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  ExternalLink,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye,
  Loader2,Copy 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface Brief {
  id: string;
  title: string;
  keyword: string;
  wordCount: number;
  status: string;
  createdAt: string;
  content: string | null;
  wp_post_url?: string;
  wp_post_id?: number;
}



export default function Briefs() {
  const { currentProject } = useApp();
  const navigate = useNavigate();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'generated' | 'published'>('all');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const loadBriefs = useCallback(async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_briefs')
        .select(`
          id,
          title,
          content,
          word_count,
          status,
          created_at,
          updated_at,
          published_at,
          wp_post_id,
          wp_post_url,
          meta_description,
          keywords(keyword)
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBriefs(data?.map(b => ({
        id: b.id,
        title: b.title,
        keyword: b.keywords?.keyword || 'Unknown',
        wordCount: b.word_count || 0,
        status: b.status || 'draft',
        createdAt: b.created_at,
        content: b.content,
        wp_post_url: b.wp_post_url,
        wp_post_id: b.wp_post_id,
      })) || []);
    } catch (error) {
      console.error('Error loading briefs:', error);
      toast.error('Failed to load briefs');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  

  useEffect(() => {
    loadBriefs();
  }, [currentProject, loadBriefs]);

  const filteredBriefs = filter === 'all' 
    ? briefs 
    : briefs.filter(b => b.status === filter);

  const handlePublish = async (briefId: string) => {
  if (!currentProject) {
    toast.error('Please select a project first');
    return;
  }

  setPublishing(briefId);
  try {
    const { error } = await supabase.from("job_logs").insert({
      job_type: "publish",
      status: "pending",
      payload: { 
        briefId, 
        projectId: currentProject.id,
        publishStatus: 'draft'  // ✅ Pass status
      }
    });

    if (error) throw error;

    toast.success("✅ Publishing queued! Check back soon.");
    // Optional: Optimistic update or poll status
  } catch (error) {
    console.error('Error queueing publish:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to queue publish');
  } finally {
    setPublishing(null);
  }
};
const handleEdit = (briefId: string) => {
  navigate(`/briefs/${briefId}/edit`);
};

const handleCopyBrief = async (brief: Brief) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentProject) {
      toast.error('Missing user or project');
      return;
    }

    // ✅ FIXED: Check if keyword exists first
    const { data: existingKeyword, error: checkError } = await supabase
      .from('keywords')
      .select('id')
      .eq('project_id', currentProject.id)
      .eq('keyword', brief.keyword)
      .maybeSingle();

    if (checkError) throw checkError;

    let keywordId: string;

    if (existingKeyword) {
      // ✅ Use existing keyword (no duplicate)
      keywordId = existingKeyword.id;
    } else {
      // Create new keyword only if doesn't exist
      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          keyword: brief.keyword,
          status: 'ready'
        })
        .select('id')
        .single();

      if (keywordError) throw keywordError;
      keywordId = keywordData.id;
    }

    // Create brief copy
    const { data: newBrief, error: briefError } = await supabase
      .from('content_briefs')
      .insert({
        project_id: currentProject.id,
        user_id: user.id,
        title: `${brief.title} (Copy)`,
        content: brief.content,
        word_count: brief.wordCount,
        status: 'draft',
        meta_description: brief.content?.slice(0, 160) || '',
        keyword_id: keywordId
      })
      .select(`
        id, title, word_count, status, created_at, content, wp_post_url, wp_post_id,
        keywords(keyword)
      `)
      .single();

    if (briefError) throw briefError;

    const copiedBrief: Brief = {
      id: newBrief.id,
      title: newBrief.title,
      keyword: newBrief.keywords?.keyword || brief.keyword,
      wordCount: newBrief.word_count || 0,
      status: newBrief.status || 'draft',
      createdAt: newBrief.created_at,
      content: newBrief.content,
      wp_post_url: newBrief.wp_post_url,
      wp_post_id: newBrief.wp_post_id
    };

    toast.success('✅ Brief copied!');
    setBriefs(prev => [copiedBrief, ...prev]);
  } catch (error: any) {
    console.error('Copy error:', error);
    toast.error(`Copy failed: ${error.message}`);
  }
};




  // ... rest of your component stays the same


  const handleDelete = async (briefId: string) => {
    if (!confirm('Are you sure you want to delete this brief?')) return;

    try {
      const { error } = await supabase
        .from('content_briefs')
        .delete()
        .eq('id', briefId);

      if (error) throw error;

      setBriefs(prev => prev.filter(b => b.id !== briefId));
      toast.success('Brief deleted');
    } catch (error) {
      console.error('Error deleting brief:', error);
      toast.error('Failed to delete brief');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'generated':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 dark">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Briefs</h1>
            <p className="text-muted-foreground">Manage and publish your SEO-optimized content</p>
          </div>
          <Button variant="gradient" onClick={() => navigate('/keywords')}>
            <Plus className="h-4 w-4" />
            New Brief
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'draft', 'generated', 'published'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Briefs Grid */}
        {filteredBriefs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No briefs yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first brief from the Keywords page
            </p>
            <Button variant="gradient" onClick={() => navigate('/keywords')}>
              <Plus className="h-4 w-4" />
              Add Keywords
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBriefs.map((brief) => (
              <div 
                key={brief.id}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(brief.status)}
                    <span className={`text-xs font-medium capitalize ${
                      brief.status === 'published' ? 'text-primary' :
                      brief.status === 'generated' ? 'text-blue-500' : 'text-muted-foreground'
                    }`}>
                      {brief.status}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-8 w-8"
    onClick={() => handleCopyBrief(brief)}
    title="Copy brief"
  >
    <Copy className="h-4 w-4" />
  </Button>
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-8 w-8"
    onClick={() => handleEdit(brief.id)}
    title="Edit brief"
  >
    <Edit3 className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" className="h-8 w-8">
    <Eye className="h-4 w-4" />
  </Button>
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-8 w-8 text-destructive hover:text-destructive"
    onClick={() => handleDelete(brief.id)}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>

                </div>

                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {brief.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">
                    {brief.keyword}
                  </span>
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{brief.wordCount.toLocaleString()} words</span>
                  <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                </div>

                {brief.status === 'generated' && (
                  <Button 
                    variant="gradient" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handlePublish(brief.id)}
                    disabled={publishing === brief.id}
                  >
                    {publishing === brief.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Publish to WordPress
                  </Button>
                )}

                {brief.status === 'draft' && (
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4" />
                    Generate Brief
                  </Button>
                )}

                {/* ✅ FIXED: View on Site button with proper link */}
                {brief.status === 'published' && brief.wp_post_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href={brief.wp_post_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Site
                    </a>
                  </Button>
                )}

                {/* ✅ Show message if published but no WP URL */}
                {brief.status === 'published' && !brief.wp_post_url && (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Publishing...
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
