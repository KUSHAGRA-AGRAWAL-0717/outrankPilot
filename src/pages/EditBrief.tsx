import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BriefData {
  id: string;
  title: string;
  content: string;
  meta_description: string;
  word_count: number;
  keyword_id: string;
}

export default function EditBrief() {
  const { briefId } = useParams<{ briefId: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<BriefData | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedMetaDesc, setEditedMetaDesc] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!briefId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('content_briefs')
          .select('id, title, content, meta_description, word_count, keyword_id')
          .eq('id', briefId)
          .single();

        if (error) throw error;

        setData(data);
        setEditedTitle(data.title);
        setEditedMetaDesc(data.meta_description || '');
        setEditedContent(data.content || '');
        setWordCount(data.word_count || 0);
      } catch (error) {
        console.error('Failed to load brief:', error);
        toast.error('Failed to load brief');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [briefId]);

  // Calculate word count from HTML content
  useEffect(() => {
    if (!editedContent) {
      setWordCount(0);
      return;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editedContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [editedContent]);

  const save = async () => {
    if (!data || !briefId) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('content_briefs')
        .update({
          title: editedTitle,
          meta_description: editedMetaDesc,
          content: editedContent,
          word_count: wordCount
        })
        .eq('id', briefId);

      if (error) throw error;

      toast.success('✅ Changes saved successfully!');
      
      setData({
        ...data,
        title: editedTitle,
        meta_description: editedMetaDesc,
        content: editedContent,
        word_count: wordCount
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Quill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      ['blockquote', 'code-block']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#5B6B8A] text-lg mb-4">Brief not found</div>
          <button
            onClick={() => navigate('/briefs')}
            className="text-[#1B64F2] hover:underline"
          >
            Return to Briefs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E6EAF2] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/briefs')}
                className="flex items-center gap-2 text-[#5B6B8A] hover:text-[#0B1F3B] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Briefs</span>
              </button>
            </div>
            
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Metadata Card */}
        <div className="bg-white rounded-xl border border-[#E6EAF2] p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0B1F3B] mb-4">Article Metadata</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
                Article Title
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E6EAF2] rounded-lg text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#1B64F2] focus:border-transparent"
                placeholder="Enter article title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
                Meta Description
              </label>
              <textarea
                value={editedMetaDesc}
                onChange={(e) => setEditedMetaDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-[#E6EAF2] rounded-lg text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#1B64F2] focus:border-transparent resize-none"
                placeholder="Enter meta description..."
              />
              <div className="mt-1 text-xs text-[#8A94B3]">
                {editedMetaDesc.length} / 160 characters recommended
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-[#E6EAF2]">
              <div className="text-sm text-[#5B6B8A]">
                Word Count: <span className="font-medium text-[#0B1F3B]">{wordCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="bg-white rounded-xl border border-[#E6EAF2] shadow-sm overflow-hidden">
          <div className="border-b border-[#E6EAF2] px-6 py-4 bg-[#F6F8FC]">
            <h2 className="text-lg font-semibold text-[#0B1F3B]">
              ✍️ Content Editor
            </h2>
            <p className="text-sm text-[#5B6B8A] mt-1">
              Use the toolbar to format your content - no HTML knowledge required!
            </p>
          </div>

          <div className="p-6">
            <ReactQuill 
              theme="snow"
              value={editedContent}
              onChange={setEditedContent}
              modules={modules}
              formats={formats}
              className="quill-editor"
              placeholder="Start writing your content here..."
            />
          </div>
        </div>
      </div>

      <style>{`
        /* Quill Editor Customization */
        .quill-editor .ql-container {
          min-height: 500px;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .quill-editor .ql-editor {
          min-height: 500px;
          padding: 24px;
          line-height: 1.8;
        }

        .quill-editor .ql-toolbar {
          border: 1px solid #E6EAF2;
          border-bottom: 2px solid #E6EAF2;
          border-radius: 8px 8px 0 0;
          background: #F6F8FC;
          padding: 12px;
        }

        .quill-editor .ql-container {
          border: 1px solid #E6EAF2;
          border-top: none;
          border-radius: 0 0 8px 8px;
          background: white;
        }

        .quill-editor .ql-editor h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #0B1F3B;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .quill-editor .ql-editor h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0B1F3B;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .quill-editor .ql-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0B1F3B;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .quill-editor .ql-editor p {
          color: #5B6B8A;
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .quill-editor .ql-editor ul,
        .quill-editor .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .quill-editor .ql-editor li {
          color: #5B6B8A;
          margin-bottom: 0.5rem;
        }

        .quill-editor .ql-editor strong {
          font-weight: 600;
          color: #0B1F3B;
        }

        .quill-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .quill-editor .ql-editor blockquote {
          border-left: 4px solid #1B64F2;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #5B6B8A;
          font-style: italic;
        }

        .quill-editor .ql-editor.ql-blank::before {
          color: #8A94B3;
          font-style: normal;
        }

        /* Toolbar button hover effects */
        .quill-editor .ql-toolbar button:hover,
        .quill-editor .ql-toolbar button:focus {
          color: #1B64F2;
        }

        .quill-editor .ql-toolbar button.ql-active {
          color: #1B64F2;
        }

        .quill-editor .ql-stroke {
          stroke: #5B6B8A;
        }

        .quill-editor .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #1B64F2;
        }

        .quill-editor .ql-fill {
          fill: #5B6B8A;
        }

        .quill-editor .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #1B64F2;
        }
      `}</style>
    </div>
  );
}
