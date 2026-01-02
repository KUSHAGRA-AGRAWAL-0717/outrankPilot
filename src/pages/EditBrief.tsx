import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Clock,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

interface Brief {
  id: string;
  title: string;
  keyword: string;
  content: string | null;
  word_count: number;
  status: string;
  meta_description: string | null;
  outline: string | null;
}

export default function EditBrief() {
  const { briefId } = useParams<{ briefId: string }>();
  const { currentProject } = useApp();
  const navigate = useNavigate();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Load brief data
  useEffect(() => {
    if (!briefId || !currentProject) return;

    const loadBrief = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('content_briefs')
          .select(`
            id, title, content, word_count, status, 
            meta_description, outline,
            keywords(keyword)
          `)
          .eq('id', briefId)
          .eq('project_id', currentProject.id)
          .single();

        if (error) throw error;
        if (data) {
          setBrief(data);
          setWordCount(data.word_count || 0);
        }
      } catch (error) {
        console.error('Error loading brief:', error);
        toast.error('Failed to load brief');
        navigate('/briefs');
      } finally {
        setLoading(false);
      }
    };

    loadBrief();
  }, [briefId, currentProject, navigate]);

  // Update word count
  const updateWordCount = (content: string) => {
    const count = content.length > 0 ? content.split(/\s+/).length : 0;
    setWordCount(count);
  };

  const handleSave = async () => {
    if (!brief || !currentProject) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_briefs')
        .update({
          title: brief.title,
          content: brief.content,
          word_count: wordCount,
          meta_description: brief.meta_description,
          outline: brief.outline,
          updated_at: new Date().toISOString()
        })
        .eq('id', briefId)
        .eq('project_id', currentProject.id);

      if (error) throw error;

      toast.success('Brief saved successfully!');
      navigate('/briefs');
    } catch (error) {
      console.error('Error saving brief:', error);
      toast.error('Failed to save brief');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/briefs');
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

  if (!brief) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Brief not found</h2>
          <Button onClick={() => navigate('/briefs')} variant="outline">
            Back to Briefs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/briefs')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Edit Brief
            </h1>
            <p className="text-muted-foreground">
              {brief.status === 'published' ? <CheckCircle2 className="h-4 w-4 inline mr-1 text-primary" /> : <Clock className="h-4 w-4 inline mr-1 text-muted-foreground" />}
              {brief.keyword} • {wordCount.toLocaleString()} words
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Title & Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content
              </CardTitle>
              <CardDescription>Title and main content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={brief.title}
                  onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                  className="h-12"
                  placeholder="Enter brief title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={brief.content || ''}
                  onChange={(e) => {
                    setBrief({ ...brief, content: e.target.value });
                    updateWordCount(e.target.value);
                  }}
                  rows={20}
                  placeholder="Write your SEO-optimized content here..."
                  className="font-sans resize-vertical"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {wordCount} words
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Meta & Outline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SEO & Outline
              </CardTitle>
              <CardDescription>Meta description and content outline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta">Meta Description</Label>
                <Textarea
                  id="meta"
                  value={brief.meta_description || ''}
                  onChange={(e) => setBrief({ ...brief, meta_description: e.target.value })}
                  rows={4}
                  maxLength={160}
                  placeholder="Max 160 characters for SEO"
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {brief.meta_description?.length || 0}/160 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outline">Content Outline</Label>
                <Textarea
                  id="outline"
                  value={brief.outline || ''}
                  onChange={(e) => setBrief({ ...brief, outline: e.target.value })}
                  rows={8}
                  placeholder="H1, H2, H3 structure and key points..."
                  className="resize-vertical"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !brief.title.trim()}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Brief
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
