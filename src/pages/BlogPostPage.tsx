import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#0B1F3B] mb-4">Post Not Found</h1>
          <p className="text-xl text-[#5B6B8A] mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate('/blog')}
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0B1F3B] px-6 md:px-12 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-8">
        <Button
          onClick={() => navigate('/blog')}
          className="bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>
      </div>

      {/* Article Header */}
      <article className="space-y-8">
        <header className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-[#0B1F3B] leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-[#8A94B3]">
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            {post.updated_at !== post.created_at && (
              <span>
                • Updated {new Date(post.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>

          <p className="text-2xl text-[#5B6B8A] leading-relaxed">
            {post.excerpt}
          </p>
        </header>

        {/* Divider */}
        <div className="border-t border-[#E6EAF2] my-12"></div>

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />
      </article>

      {/* Back to Blog CTA */}
      <div className="mt-16 pt-12 border-t border-[#E6EAF2]">
        <Button
          onClick={() => navigate('/blog')}
          className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold px-8 py-6 text-lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Read More Articles
        </Button>
      </div>

      {/* Styling for the content */}
      <style>{`
        .prose {
          color: #0B1F3B;
          line-height: 1.8;
        }
        
        .prose h2 {
          color: #0B1F3B;
          font-size: 2rem;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }
        
        .prose h3 {
          color: #0B1F3B;
          font-size: 1.625rem;
          font-weight: 600;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }
        
        .prose h4 {
          color: #0B1F3B;
          font-size: 1.375rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .prose p {
          color: #5B6B8A;
          margin-bottom: 1.5rem;
          line-height: 1.8;
          font-size: 1.125rem;
        }
        
        .prose ul, .prose ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }
        
        .prose li {
          color: #5B6B8A;
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        
        .prose strong {
          color: #0B1F3B;
          font-weight: 600;
        }
        
        .prose a {
          color: #1B64F2;
          text-decoration: underline;
          transition: color 0.2s;
        }
        
        .prose a:hover {
          color: #1246C9;
        }
        
        .prose figure {
          margin: 3rem 0;
          text-align: center;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .prose figcaption {
          margin-top: 1rem;
          font-size: 0.9375rem;
          color: #8A94B3;
          font-style: italic;
        }
        
        .prose code {
          background: #F6F8FC;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875em;
          color: #1B64F2;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }
        
        .prose pre {
          background: #1E1E1E;
          color: #D4D4D4;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 2rem 0;
        }
        
        .prose pre code {
          background: transparent;
          padding: 0;
          color: #D4D4D4;
        }
        
        .prose blockquote {
          border-left: 4px solid #FFD84D;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #5B6B8A;
        }
      `}</style>
    </div>
  );
};

export default BlogPostPage;