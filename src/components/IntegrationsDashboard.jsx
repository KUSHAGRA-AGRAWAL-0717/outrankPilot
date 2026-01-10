import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ConnectNotion from "./ConnectNotion";
import ConnectWordPress from "./ConnectWordPress";

const IntegrationsDashboard = ({ projectId, user }) => {
  const [notionConnected, setNotionConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notionWorkspace, setNotionWorkspace] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Test publish fields
  const [testDatabaseId, setTestDatabaseId] = useState("2e428d3dffaf8090b203000ca31462d1");
  const [testContentId, setTestContentId] = useState("04bde649-4b4b-4ab2-aca2-06e924b9cf4b");

  useEffect(() => {
    if (user?.id) {
      checkConnections();
    }
  }, [user]);

  const checkConnections = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notion_accounts")
        .select("id, workspace_name, workspace_icon")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking Notion connection:", error);
      }

      setNotionConnected(!!data);
      setNotionWorkspace(data);
    } catch (error) {
      console.error("Failed to check connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectNotion = async () => {
    if (!confirm("Are you sure you want to disconnect Notion?")) return;

    try {
      const { error } = await supabase
        .from("notion_accounts")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setNotionConnected(false);
      setNotionWorkspace(null);
      alert("Notion disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect Notion:", error);
      alert("Failed to disconnect Notion");
    }
  };

  // Publish to Notion function
  const publishToNotion = async (contentBriefId, databaseId) => {
    if (!contentBriefId || !databaseId) {
      alert("Please provide both Content Brief ID and Database ID");
      return;
    }

    try {
      setPublishing(true);

      // Get session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No active session. Please log in again.");
      }

      console.log("Publishing with token:", session.access_token.substring(0, 20) + "...");

      const { data, error } = await supabase.functions.invoke('publish-notion', {
        body: {
          contentBriefId: contentBriefId,
          databaseId: databaseId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Failed to publish:", error);
        alert(`Failed to publish: ${error.message}`);
        return;
      }

      if (data?.success) {
        alert(`✅ Successfully published!\n\nPage URL: ${data.pageUrl}\n\nOpen in Notion to view.`);
        console.log("Published! Page URL:", data.pageUrl);
      } else {
        alert(`Error: ${data?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert(`Failed to publish: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleTestPublish = () => {
    publishToNotion(testContentId, testDatabaseId);
  };

  // Test if database ID is valid - MOVED TO EDGE FUNCTION
  const testDatabaseAccess = async () => {
    if (!testDatabaseId) {
      alert("Please enter a database ID first");
      return;
    }

    try {
      setTesting(true);

      // Get session for auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No active session");
      }

      // Call edge function to test database access
      const { data, error } = await supabase.functions.invoke('test-notion-database', {
        body: {
          databaseId: testDatabaseId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        alert(`✅ Success! Database found: "${data.databaseName}"`);
        console.log("Database info:", data);
      } else {
        alert(`❌ ${data?.error || "Database not accessible"}`);
      }
    } catch (error) {
      console.error("Test error:", error);
      alert(`❌ Error: ${error.message}\n\nMake sure:\n1. Database ID is correct\n2. Integration has access to the database in Notion`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            📝 Notion
          </h3>
          {notionConnected ? (
            <div className="space-y-3">
              <div className="text-green-600 font-medium flex items-center gap-2">
                ✅ Connected
              </div>
              {notionWorkspace?.workspace_name && (
                <div className="text-sm text-gray-600">
                  Workspace: {notionWorkspace.workspace_name}
                </div>
              )}
              <button
                onClick={disconnectNotion}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <ConnectNotion projectId={projectId} />
          )}
        </div>

        <div className="border p-6 rounded-xl shadow-sm opacity-50">
          <ConnectWordPress projectId={projectId} />
        </div>
      </div>

      {/* Test Publishing Section - Only show when Notion is connected */}
      {notionConnected && (
        <div className="border p-6 rounded-xl shadow-sm bg-blue-50">
          <h3 className="font-bold text-lg mb-4">📤 Test Notion Publishing</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Notion Database ID
              </label>
              <input
                type="text"
                value={testDatabaseId}
                onChange={(e) => setTestDatabaseId(e.target.value)}
                placeholder="2e428d3dffaf8090b203000ca31462d1"
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                ✅ Pre-filled with your database ID
              </p>
              <button
                onClick={testDatabaseAccess}
                disabled={testing || !testDatabaseId}
                className="mt-2 px-4 py-1.5 text-sm bg-gray-600 text-black rounded hover:bg-gray-700 disabled:bg-gray-400"
              >
                {testing ? "Testing..." : "🔍 Test Database Access"}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Content Brief ID
              </label>
              <input
                type="text"
                value={testContentId}
                onChange={(e) => setTestContentId(e.target.value)}
                placeholder="04bde649-4b4b-4ab2-aca2-06e924b9cf4b"
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                ✅ Pre-filled: "Mastering Node Optimization" article
              </p>
            </div>

            <div className="pt-2 border-t">
              <button
                onClick={handleTestPublish}
                disabled={publishing || !testDatabaseId || !testContentId}
                className="w-full px-6 py-3 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {publishing ? "Publishing..." : "📝 Publish to Notion"}
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">
                This will create a new page in your Notion database
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsDashboard;