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
  Loader2,
  Copy 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Add props interface
interface BriefsProps {
  projectId?: string | null;
  onboardingMode?: boolean;
  onBriefsCreated?: () => void;
}

export default function Briefs({ 
  projectId: propProjectId, 
  onboardingMode = false,
  onBriefsCreated 
}: BriefsProps = {}) {
  const { currentProject, user } = useApp();
  const navigate = useNavigate();
  
  // Use propProjectId in onboarding mode, otherwise use currentProject
  const effectiveProjectId = onboardingMode ? propProjectId : currentProject?.id;
  
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'generated' | 'published'>('all');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [projectWPDetails, setProjectWPDetails] = useState({
    wp_url: '',
    wp_username: '',
    wp_app_password: ''
  });
  const [keywords, setKeywords] = useState<Array<{ id: string; keyword: string }>>([]);
  const [generatingForKeyword, setGeneratingForKeyword] = useState<string | null>(null);

  // Load project WP details
  useEffect(() => {
    if (effectiveProjectId) {
      supabase
        .from('projects')
        .select('wp_url, wp_username, wp_app_password')
        .eq('id', effectiveProjectId)
        .single()
        .then(({data, error}) => {
          if (error) {
            console.error('Error fetching WP details:', error);
            return;
          }
          setProjectWPDetails({
            wp_url: data.wp_url || '',
            wp_username: data.wp_username || '',
            wp_app_password: data.wp_app_password || ''
          });
        });
    }
  }, [effectiveProjectId]);

  // Load keywords for onboarding mode
  const loadKeywords = useCallback(async () => {
    if (!effectiveProjectId || !onboardingMode) return;

    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('id, keyword, status')
        .eq('project_id', effectiveProjectId)
        .in('status', ['ready', 'generated'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      console.error('Error loading keywords:', error);
    }
  }, [effectiveProjectId, onboardingMode]);

  const loadBriefs = useCallback(async () => {
    if (!effectiveProjectId) {
      setLoading(false);
      return;
    }

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
        .eq('project_id', effectiveProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBriefs = data?.map(b => ({
        id: b.id,
        title: b.title,
        keyword: b.keywords?.keyword || 'Unknown',
        wordCount: b.word_count || 0,
        status: b.status || 'draft',
        createdAt: b.created_at,
        content: b.content,
        wp_post_url: b.wp_post_url,
        wp_post_id: b.wp_post_id,
      })) || [];

      setBriefs(mappedBriefs);

      // If in onboarding mode and briefs exist, trigger callback
      if (onboardingMode && mappedBriefs.length > 0 && onBriefsCreated) {
        onBriefsCreated();
      }
    } catch (error) {
      console.error('Error loading briefs:', error);
      toast.error('Failed to load briefs');
      setBriefs([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId, onboardingMode, onBriefsCreated]);

  useEffect(() => {
    loadBriefs();
    if (onboardingMode) {
      loadKeywords();
    }
  }, [loadBriefs, loadKeywords, onboardingMode]);

  // Generate brief for a keyword
  const handleGenerateBriefForKeyword = async (keywordId: string, keyword: string) => {
    if (!effectiveProjectId || !user) {
      toast.error('Missing project or user information');
      return;
    }

    setGeneratingForKeyword(keywordId);
    
    try {
      toast.success('Brief generation started for: ' + keyword);

      const { error: functionError } = await supabase.functions.invoke(
        'generate-brief',
        {
          body: {
            keyword_id: keywordId,
            keyword: keyword,
            project_id: effectiveProjectId,
            user_id: user.id,
          },
        }
      );

      if (functionError) {
        console.error('Brief generation error:', functionError);
        toast.error('Failed to generate brief');
      } else {
        // Wait a moment then reload briefs
        setTimeout(() => {
          loadBriefs();
          toast.success('Brief generated successfully!');
        }, 2000);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to start brief generation');
    } finally {
      setGeneratingForKeyword(null);
    }
  };

  const filteredBriefs = filter === 'all' 
    ? briefs 
    : briefs.filter(b => b.status === filter);

  const handlePublish = async (briefId: string) => {
    if (!effectiveProjectId) {
      toast.error('Please select a project first');
      return;
    }

    if (!projectWPDetails.wp_url || !projectWPDetails.wp_username || !projectWPDetails.wp_app_password) {
      toast.error('Please connect WordPress first in project settings');
      return;
    }

    setPublishing(briefId);
    try {
      const { error: functionError } = await supabase.functions.invoke("publish-to-wordpress", {
        body: { 
          briefId, 
          projectId: effectiveProjectId,
          publishStatus: 'draft'
        }
      });

      if (functionError) throw functionError;

      toast.success("✅ Publishing to WordPress...");
      setTimeout(() => loadBriefs(), 2000);
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
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
      if (!user || !effectiveProjectId) {
        toast.error('Missing user or project');
        return;
      }

      const { data: existingKeyword, error: checkError } = await supabase
        .from('keywords')
        .select('id')
        .eq('project_id', effectiveProjectId)
        .eq('keyword', brief.keyword)
        .maybeSingle();

      if (checkError) throw checkError;

      let keywordId: string;

      if (existingKeyword) {
        keywordId = existingKeyword.id;
      } else {
        const { data: keywordData, error: keywordError } = await supabase
          .from('keywords')
          .insert({
            project_id: effectiveProjectId,
            user_id: user.id,
            keyword: brief.keyword,
            status: 'ready'
          })
          .select('id')
          .single();

        if (keywordError) throw keywordError;
        keywordId = keywordData.id;
      }

      const { data: newBrief, error: briefError } = await supabase
        .from('content_briefs')
        .insert({
          project_id: effectiveProjectId,
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
        return <CheckCircle2 className="h-4 w-4 text-[#3EF0C1]" />;
      case 'generated':
        return <FileText className="h-4 w-4 text-[#1B64F2]" />;
      default:
        return <Clock className="h-4 w-4 text-[#8A94B3]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  // Onboarding Mode: Show keywords to generate briefs from
  if (onboardingMode) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-[#5B6B8A] mb-4">
          Select keywords to generate content briefs for:
        </div>

        {/* Keywords available for brief generation */}
        {keywords.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-[#0B1F3B]">Available Keywords</h3>
            <div className="space-y-2">
              {keywords.map((kw) => {
                const alreadyHasBrief = briefs.some(b => b.keyword === kw.keyword);
                return (
                  <div 
                    key={kw.id}
                    className="flex items-center justify-between p-4 bg-[#F6F8FC] rounded-lg border border-[#E5E7EB]"
                  >
                    <span className="font-medium text-[#0B1F3B]">{kw.keyword}</span>
                    {alreadyHasBrief ? (
                      <span className="text-xs text-[#10B981] flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Brief Generated
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateBriefForKeyword(kw.id, kw.keyword)}
                        disabled={generatingForKeyword === kw.id}
                        className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
                      >
                        {generatingForKeyword === kw.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-2" />
                            Generate Brief
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generated Briefs */}
        {briefs.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-medium text-[#0B1F3B]">Generated Briefs ({briefs.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {briefs.map((brief) => (
                <div 
                  key={brief.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E7EB]"
                >
                  <div>
                    <div className="font-medium text-[#0B1F3B]">{brief.title}</div>
                    <div className="text-xs text-[#5B6B8A] mt-1">
                      {brief.wordCount} words • {brief.keyword}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(brief.status)}
                    <span className="text-xs text-[#5B6B8A] capitalize">{brief.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {keywords.length === 0 && (
          <div className="text-center py-8 text-[#8A94B3]">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No keywords available for brief generation</p>
            <p className="text-xs mt-1">Add keywords in the previous step</p>
          </div>
        )}
      </div>
    );
  }


  return (
  
      <div className="space-y-6 bg-[#F6F8FC] min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F3B]">Content Briefs</h1>
            <p className="text-[#5B6B8A]">Manage and publish your SEO-optimized content</p>
          </div>
          <Button 
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
            onClick={() => navigate('/keywords')}
          >
            <Plus className="h-4 w-4" />
            New Brief
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'draft', 'generated', 'published'] as const).map((status) => (
            <Button
              key={status}
              className={filter === status 
                ? 'bg-[#1B64F2] text-white hover:bg-[#1246C9]' 
                : 'bg-white text-[#5B6B8A] hover:bg-[#F6F8FC] border border-[#8A94B3]/30'
              }
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Briefs Grid */}
        {filteredBriefs.length === 0 ? (
          <div className="rounded-xl border border-[#8A94B3]/30 bg-white p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-[#8A94B3] mb-4" />
            <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">No briefs yet</h3>
            <p className="text-[#5B6B8A] mb-4">
              Generate your first brief from the Keywords page
            </p>
            <Button 
              className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
              onClick={() => navigate('/keywords')}
            >
              <Plus className="h-4 w-4" />
              Add Keywords
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBriefs.map((brief) => (
              <div 
                key={brief.id}
                className="group rounded-xl border border-[#8A94B3]/30 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#1B64F2]/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(brief.status)}
                    <span className={`text-xs font-medium capitalize ${
                      brief.status === 'published' ? 'text-[#3EF0C1]' :
                      brief.status === 'generated' ? 'text-[#1B64F2]' : 'text-[#8A94B3]'
                    }`}>
                      {brief.status}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-[#F6F8FC] text-[#5B6B8A]"
                      onClick={() => handleCopyBrief(brief)}
                      title="Copy brief"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-[#F6F8FC] text-[#5B6B8A]"
                      onClick={() => handleEdit(brief.id)}
                      title="Edit brief"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button className="h-8 w-8 p-0 bg-transparent hover:bg-[#F6F8FC] text-[#5B6B8A]">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-red-50 text-red-500"
                      onClick={() => handleDelete(brief.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-[#0B1F3B] mb-2 line-clamp-2">
                  {brief.title}
                </h3>
                
                <p className="text-sm text-[#5B6B8A] mb-4">
                  <span className="font-mono bg-[#F6F8FC] px-1.5 py-0.5 rounded text-xs text-[#0B1F3B]">
                    {brief.keyword}
                  </span>
                </p>

                <div className="flex items-center justify-between text-sm text-[#8A94B3] mb-4">
                  <span>{brief.wordCount.toLocaleString()} words</span>
                  <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                </div>

                {brief.status === 'generated' && (
                  <Button 
  className="w-full bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
  size="sm"
  onClick={() => handlePublish(brief.id)}
  disabled={publishing === brief.id || !projectWPDetails.wp_url || !projectWPDetails.wp_username || !projectWPDetails.wp_app_password}
>
  {publishing === brief.id ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : (
    <ExternalLink className="h-4 w-4 mr-2" />
  )}
  {( !projectWPDetails.wp_url || !projectWPDetails.wp_username || !projectWPDetails.wp_app_password) ? 
    'Connect WordPress to publish' : 
    'Publish to WordPress'
  }
</Button>
                )}

                {brief.status === 'draft' && (
                  <Button 
                    className="w-full bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
                    size="sm"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Brief
                  </Button>
                )}

                {brief.status === 'published' && brief.wp_post_url && (
                  <Button 
                    className="w-full bg-white hover:bg-[#F6F8FC] text-[#1B64F2] border border-[#1B64F2]/30"
                    size="sm"
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

                {brief.status === 'published' && !brief.wp_post_url && (
                  <Button 
                    className="w-full bg-white text-[#8A94B3] border border-[#8A94B3]/30"
                    size="sm" 
                    disabled
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Publishing...
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}