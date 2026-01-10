// Updated BlogPage.tsx - Exact Outrank.so Clone
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('posts')
        .select('title, excerpt, slug, created_at')
        .order('created_at', { ascending: false });
      setPosts(data || []);
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0B1F3B] px-6 md:px-12 py-24 max-w-4xl mx-auto">
      {/* Hero - Exact Match */}
      <div className="text-center mb-24">
        <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-[#0B1F8A] to-[#1B64F2] bg-clip-text text-transparent">
          OutrankPilot's Blog
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#5B6B8A] leading-tight max-w-3xl mx-auto">
          Enhance your website with AI-driven, SEO-optimized content—published directly to your blog. 
          Boost your search rankings and increase traffic effortlessly with our automated blogging solution.
        </h2>
      </div>

      {/* Posts - Vertical Stack, No Grid */}
      <div className="space-y-12">
        {posts.map((post: any) => (
          <article key={post.slug} className="group cursor-pointer hover:bg-[#F6F8FC] p-8 rounded-2xl transition-all duration-300 border border-transparent hover:border-[#1B64F2]/20">
            <a href={`/blog/${post.slug}`} className="block">
              <h3 className="text-3xl md:text-4xl font-bold text-[#0B1F3B] mb-4 group-hover:text-[#1B64F2] transition-colors leading-tight">
                {post.title}
              </h3>
              <p className="text-xl text-[#5B6B8A] leading-relaxed">
                {post.excerpt}
              </p>
            </a>
          </article>
        ))}
      </div>

      {/* Add "Load More" or Infinite Scroll Hook Here */}
      <div className="text-center mt-24">
        <button className="btn-primary px-12 py-6 text-xl font-semibold">Load More Posts</button>
      </div>
    </div>
  );
};

export default BlogPage;
