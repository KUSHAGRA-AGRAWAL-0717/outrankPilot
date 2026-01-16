import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, FileText, Eye, EyeOff } from "lucide-react";

interface Brief {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  word_count: number;
  notion_page_id?: string;
  meta_description?: string;
}

const IntegrationsDashboard = ({ projectId, user }) => {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // User's Notion credentials
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  
  // Brief selection
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBriefs, setSelectedBriefs] = useState<string[]>([]);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  
  // Testing
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadCredentials();
      loadBriefs();
    }
  }, [projectId]);

  const loadCredentials = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("notion_database_id")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      
      if (data?.notion_database_id) {
        setNotionDatabaseId(data.notion_database_id);
        setCredentialsSaved(true);
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  };

  const saveCredentials = async () => {
    if (!projectId || !notionDatabaseId.trim() || !notionToken.trim()) {
      alert("Please enter both Database ID and Integration Token");
      return;
    }

    try {
      setLoading(true);
      
      // Save database ID to projects table
      const { error } = await supabase
        .from("projects")
        .update({ notion_database_id: notionDatabaseId.trim(),
          notion_token: notionToken.trim()
         })
        .eq("id", projectId);

      if (error) throw error;
      
      setCredentialsSaved(true);
      alert("✅ Notion credentials saved successfully!");
    } catch (error) {
      console.error("Error saving credentials:", error);
      alert("❌ Failed to save credentials");
    } finally {
      setLoading(false);
    }
  };

  const loadBriefs = async () => {
    if (!projectId) return;

    try {
      setLoadingBriefs(true);
      const { data, error } = await supabase
        .from("content_briefs")
        .select("id, title, content, status, created_at, word_count, notion_page_id, meta_description")
        .eq("project_id", projectId)
        .in("status", ["generated", "published"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBriefs(data || []);
    } catch (error) {
      console.error("Error loading briefs:", error);
    } finally {
      setLoadingBriefs(false);
    }
  };

  const toggleBriefSelection = (briefId: string) => {
    setSelectedBriefs(prev => 
      prev.includes(briefId) 
        ? prev.filter(id => id !== briefId)
        : [...prev, briefId]
    );
  };

  const selectAllBriefs = () => {
    if (selectedBriefs.length === briefs.length) {
      setSelectedBriefs([]);
    } else {
      setSelectedBriefs(briefs.map(b => b.id));
    }
  };

  const testDatabaseAccess = async () => {
    if (!notionDatabaseId.trim() || !notionToken.trim()) {
      alert("Please enter both Database ID and Integration Token first");
      return;
    }

    try {
      setTesting(true);

      const { data, error } = await supabase.functions.invoke('publish-notion', {
        body: {
          action: 'test',
          databaseId: notionDatabaseId.trim(),
          notionToken: notionToken
        }
      });

      if (error) throw error;

      if (data?.success) {
        alert(`✅ Success! Database found: "${data.databaseTitle || 'Untitled'}"\n\nYou can now publish content to this database.`);
      } else {
        alert(`❌ ${data?.error || "Database not accessible"}`);
      }
    } catch (error) {
      console.error("Test error:", error);
      alert(`❌ Error: ${error.message}\n\nMake sure:\n1. Database ID is correct\n2. Integration token is valid\n3. Integration has access to the database in Notion`);
    } finally {
      setTesting(false);
    }
  };

  const publishSelectedToNotion = async () => {
    if (selectedBriefs.length === 0) {
      alert("Please select at least one brief to publish");
      return;
    }

    if (!notionDatabaseId.trim() || !notionToken.trim()) {
      alert("Please enter and save your Notion credentials first");
      return;
    }

    try {
      setPublishing(true);

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const briefId of selectedBriefs) {
        try {
          const { data, error } = await supabase.functions.invoke('publish-notion', {
            body: {
              action: 'publish',
              contentBriefId: briefId,
              databaseId: notionDatabaseId.trim(),
              notionToken: notionToken
            }
          });

          if (error) throw error;

          if (data?.success) {
            successCount++;
          } else {
            failCount++;
            const brief = briefs.find(b => b.id === briefId);
            errors.push(`${brief?.title}: ${data?.error || "Unknown error"}`);
          }

          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failCount++;
          const brief = briefs.find(b => b.id === briefId);
          errors.push(`${brief?.title}: ${error.message}`);
        }
      }

      // Show results
      let message = `✅ Published ${successCount} of ${selectedBriefs.length} briefs`;
      if (failCount > 0) {
        message += `\n\n❌ Failed: ${failCount}\n${errors.slice(0, 3).join('\n')}`;
        if (errors.length > 3) {
          message += `\n... and ${errors.length - 3} more`;
        }
      }
      
      alert(message);

      // Reload briefs and clear selection
      await loadBriefs();
      setSelectedBriefs([]);
    } catch (error) {
      console.error("Publish error:", error);
      alert(`Failed to publish: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notion Credentials Configuration */}
      <div className="border p-6 rounded-xl shadow-sm bg-purple-50">
        <h3 className="font-bold text-lg mb-4">📝 Notion Configuration</h3>
        
        <div className="space-y-4">
          {/* Integration Token */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notion Integration Token <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? "text" : "password"}
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm text-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Create an integration at{" "}
              <a 
                href="https://www.notion.so/my-integrations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 underline"
              >
                notion.so/my-integrations
              </a>
            </p>
          </div>

          {/* Database ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notion Database ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={notionDatabaseId}
              onChange={(e) => setNotionDatabaseId(e.target.value)}
              placeholder="2e428d3dffaf8090b203000ca31462d1"
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm text-black"
            />
            <p className="text-xs text-gray-600 mt-1">
              Copy from your Notion database URL: notion.so/<strong>workspace</strong>/<strong className="bg-yellow-200">DATABASE_ID</strong>?v=...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={saveCredentials}
              disabled={loading || !notionToken.trim() || !notionDatabaseId.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? "Saving..." : credentialsSaved ? "✓ Update Credentials" : "Save Credentials"}
            </button>
            
            <button
              onClick={testDatabaseAccess}
              disabled={testing || !notionToken.trim() || !notionDatabaseId.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
            >
              {testing ? "Testing..." : "🔍 Test Connection"}
            </button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="font-semibold text-sm mb-2">📚 Setup Guide:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
            <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" className="text-purple-600 underline">notion.so/my-integrations</a></li>
            <li>Click "+ New integration" and give it a name</li>
            <li>Copy the "Internal Integration Token"</li>
            <li>Open your Notion database → Click "..." → "Connections" → Add your integration</li>
            <li>Copy the database ID from the URL</li>
            <li>Paste both credentials above and click "Save"</li>
          </ol>
        </div>
      </div>

      {/* Brief Selection and Publishing */}
      {credentialsSaved && notionDatabaseId && (
        <div className="border p-6 rounded-xl shadow-sm bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">📤 Publish Briefs to Notion</h3>
            {selectedBriefs.length > 0 && (
              <button
                onClick={publishSelectedToNotion}
                disabled={publishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing {selectedBriefs.length}...
                  </>
                ) : (
                  <>
                    📝 Publish {selectedBriefs.length} Selected
                  </>
                )}
              </button>
            )}
          </div>

          {loadingBriefs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : briefs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No generated briefs available to publish</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <input
                  type="checkbox"
                  checked={selectedBriefs.length === briefs.length}
                  onChange={selectAllBriefs}
                  className="w-4 h-4"
                />
                <span className="font-medium text-sm">
                  Select All ({briefs.length} briefs)
                </span>
              </div>

              {/* Brief List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {briefs.map((brief) => (
                  <div
                    key={brief.id}
                    className={`p-4 bg-white rounded-lg border transition-all ${
                      selectedBriefs.includes(brief.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedBriefs.includes(brief.id)}
                        onChange={() => toggleBriefSelection(brief.id)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {brief.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>{brief.word_count?.toLocaleString() || 0} words</span>
                          <span>•</span>
                          <span>{new Date(brief.created_at).toLocaleDateString()}</span>
                        </div>
                        {brief.notion_page_id && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Already published to Notion
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationsDashboard;
