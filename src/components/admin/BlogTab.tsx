import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useRef } from "react";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export default function BlogTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    slug: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
    "blockquote",
    "code-block",
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setEditingPost(null);
    setFormData({
      title: "",
      excerpt: "",
      slug: "",
      content: "",
    });
  };

  const handleEdit = (post: Post) => {
    setIsEditing(true);
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      content: post.content || "",
    });
  };

  const handleView = (post: Post) => {
    setViewingPost(post);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingPost(null);
    setFormData({
      title: "",
      excerpt: "",
      slug: "",
      content: "",
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.excerpt || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update({
            title: formData.title,
            excerpt: formData.excerpt,
            slug: formData.slug,
            content: formData.content,
          })
          .eq("id", editingPost.id);

        if (error) throw error;
        toast.success("Post updated successfully");
      } else {
        // Create new post
        const { error } = await supabase.from("posts").insert({
          title: formData.title,
          excerpt: formData.excerpt,
          slug: formData.slug,
          content: formData.content,
        });

        if (error) throw error;
        toast.success("Post created successfully");
      }

      handleCancel();
      loadPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      if (error.code === "23505") {
        toast.error("A post with this slug already exists");
      } else {
        toast.error("Failed to save post");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) throw error;
      toast.success("Post deleted successfully");
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  // View Post Modal
  if (viewingPost) {
    return (
      <div className="bg-white rounded-xl border border-[#E6EAF2] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0B1F3B]">View Post</h2>
          <Button
            onClick={() => setViewingPost(null)}
            className="bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-3xl font-bold text-[#0B1F3B] mb-2">
              {viewingPost.title}
            </h3>
            <p className="text-sm text-[#8A94B3]">
              Slug: {viewingPost.slug} | Created:{" "}
              {new Date(viewingPost.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#5B6B8A] mb-2">Excerpt</h4>
            <p className="text-lg text-[#5B6B8A]">{viewingPost.excerpt}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#5B6B8A] mb-2">Content</h4>
            <div className="prose prose-lg max-w-none bg-[#F6F8FC] rounded-lg p-6 text-black">
              {viewingPost.content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: viewingPost.content }}
                />
              ) : (
                <p className="text-[#8A94B3] italic">No content</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E6EAF2]">
            <Button
              onClick={() => {
                handleEdit(viewingPost);
                setViewingPost(null);
              }}
              className="bg-[#1B64F2] hover:bg-[#1246C9] text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </Button>
            <Button
              onClick={() => setViewingPost(null)}
              className="bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Create Form
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-[#E6EAF2] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0B1F3B]">
            {editingPost ? "Edit Post" : "Create New Post"}
          </h2>
          <Button
            onClick={handleCancel}
            className="bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title"
              className="bg-white border-[#E6EAF2]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
              Slug *
            </label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="post-url-slug"
              className="bg-white border-[#E6EAF2] font-mono text-sm"
            />
            <p className="text-xs text-[#8A94B3] mt-1">
              URL: /blog/{formData.slug || "your-slug"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
              Excerpt *
            </label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              placeholder="Brief summary for the blog listing page"
              rows={3}
              className="bg-white border-[#E6EAF2] text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5B6B8A] mb-2">
              Content
            </label>
            <p className="text-xs text-[#8A94B3] mb-3 flex items-center gap-2">
              <ImageIcon className="h-3 w-3" />
              Use the toolbar to format text, add images, links, and more - no
              HTML required!
            </p>
            <div className="blog-editor-wrapper">
              <ReactQuill
              ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Start writing your blog post here..."
                className="text-black"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E6EAF2]">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingPost ? "Update Post" : "Create Post"}
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Posts List
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0B1F3B]">Blog Posts</h2>
          <p className="text-[#5B6B8A]">Manage your blog content</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E6EAF2] p-12 text-center">
          <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">
            No posts yet
          </h3>
          <p className="text-[#5B6B8A] mb-4">Create your first blog post</p>
          <Button
            onClick={handleCreate}
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E6EAF2] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F6F8FC] border-b border-[#E6EAF2]">
              <tr>
                <th className="text-left p-4 font-medium text-[#5B6B8A]">
                  Title
                </th>
                <th className="text-left p-4 font-medium text-[#5B6B8A]">
                  Slug
                </th>
                <th className="text-left p-4 font-medium text-[#5B6B8A]">
                  Created
                </th>
                <th className="text-right p-4 font-medium text-[#5B6B8A]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[#E6EAF2] hover:bg-[#F6F8FC]/50"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-[#0B1F3B]">
                        {post.title}
                      </div>
                      <div className="text-sm text-[#8A94B3] line-clamp-1">
                        {post.excerpt}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-[#F6F8FC] px-2 py-1 rounded text-[#1B64F2]">
                      {post.slug}
                    </code>
                  </td>
                  <td className="p-4 text-[#5B6B8A] text-sm">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleView(post)}
                        className="h-8 w-8 p-0 bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
                        title="View post"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleEdit(post)}
                        className="h-8 w-8 p-0 bg-[#F6F8FC] hover:bg-[#E6EAF2] text-[#5B6B8A]"
                        title="Edit post"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(post.id)}
                        className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        /* Blog Editor Styling */
        .blog-editor-wrapper .ql-container {
          min-height: 400px;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .blog-editor-wrapper .ql-editor {
          min-height: 400px;
          padding: 20px;
          line-height: 1.8;
        }

        .blog-editor-wrapper .ql-toolbar {
          border: 1px solid #E6EAF2;
          border-bottom: 2px solid #E6EAF2;
          border-radius: 8px 8px 0 0;
          background: #F6F8FC;
          padding: 12px;
        }

        .blog-editor-wrapper .ql-container {
          border: 1px solid #E6EAF2;
          border-top: none;
          border-radius: 0 0 8px 8px;
          background: white;
        }

        .blog-editor-wrapper .ql-editor h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #0B1F3B;
          margin: 1.5rem 0 1rem;
        }

        .blog-editor-wrapper .ql-editor h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0B1F3B;
          margin: 1.5rem 0 1rem;
        }

        .blog-editor-wrapper .ql-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0B1F3B;
          margin: 1.25rem 0 0.75rem;
        }

        .blog-editor-wrapper .ql-editor p {
          color: #5B6B8A;
          margin-bottom: 1rem;
        }

        .blog-editor-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .blog-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #1B64F2;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #5B6B8A;
          font-style: italic;
        }

        .blog-editor-wrapper .ql-editor ul,
        .blog-editor-wrapper .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .blog-editor-wrapper .ql-editor li {
          margin-bottom: 0.5rem;
        }

        .blog-editor-wrapper .ql-editor.ql-blank::before {
          color: #8A94B3;
          font-style: normal;
        }

        /* Prose styling for viewing */
        .prose h1, .prose h2, .prose h3 {
          color: #0B1F3B;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .prose p {
          color: #5B6B8A;
          line-height: 1.8;
          margin-bottom: 1rem;
        }

        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .prose ul, .prose ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .prose li {
          color: #5B6B8A;
          margin-bottom: 0.5rem;
        }

        .prose blockquote {
          border-left: 4px solid #1B64F2;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #5B6B8A;
          font-style: italic;
        }

        .prose strong {
          font-weight: 600;
          color: #0B1F3B;
        }

        .prose a {
          color: #1B64F2;
          text-decoration: underline;
        }

        .prose code {
          background: #F6F8FC;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875em;
          color: #1B64F2;
        }
      `}</style>
    </div>
  );
}
