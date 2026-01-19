import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) {
        setError('No blog post specified');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError('Blog post not found');
        } else {
          setPost(data);
        }
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-slate-600 animate-pulse">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Post Not Found</h1>
          <p className="text-xl text-slate-600 mb-8">{error || 'This blog post does not exist.'}</p>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="px-6 md:px-12 py-16 md:py-24">
        <article className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-base font-medium">Back to Blog</span>
          </button>

          {/* Featured Image */}
          {post.image_url && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}

          {/* Post Header */}
          <header className="mb-12">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-slate-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={post.created_at} className="text-sm">
                  {formatDate(post.created_at)}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="text-sm">{calculateReadTime(post.content || '')}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-normal border-l-4 border-blue-600 pl-6 py-2">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Post Content */}
          <div 
            className="prose prose-lg md:prose-xl max-w-none
              prose-headings:text-slate-900 prose-headings:font-bold
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-blue-900
              prose-p:text-slate-700 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-ul:text-slate-700 prose-ol:text-slate-700
              prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2 prose-li:marker:text-blue-600
              prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-lg
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:text-slate-600 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
              prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;
