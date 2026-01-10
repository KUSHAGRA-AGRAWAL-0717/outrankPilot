import { supabase } from "@/integrations/supabase/client";

export default function ConnectNotion({ projectId }) {
  const connectNotion = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first");
        return;
      }

      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_NOTION_CLIENT_ID,
        redirect_uri: `${window.location.origin}/auth/notion/callback`,
        response_type: "code",
        owner: "user",
        state: btoa(JSON.stringify({ projectId, userId: user.id })),
      });

      window.localStorage.setItem("notion_pending_project", projectId);
      window.localStorage.setItem("notion_pending_user", user.id);
      
      window.location.href = `https://api.notion.com/v1/oauth/authorize?${params}`;
    } catch (error) {
      console.error("Failed to initiate Notion connection:", error);
      alert("Failed to connect to Notion. Please try again.");
    }
  };

  return (
    <button
      onClick={connectNotion}
      className="px-6 py-2 bg-purple-600 text-black rounded-lg hover:bg-purple-700 flex items-center gap-2"
    >
      📝 Connect Notion
    </button>
  );
}