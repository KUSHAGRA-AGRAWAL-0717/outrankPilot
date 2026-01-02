import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function ExportProjectButtons({ projectId }) {
  const exportProject = async (format) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/export-project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          project_id: projectId,
          format,
        }),
      });

      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      const blob =
        format === "json"
          ? new Blob([JSON.stringify(await res.json(), null, 2)], {
              type: "application/json",
            })
          : new Blob([await res.text()], {
              type: "text/markdown",
            });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "json"
          ? `project-${projectId}.json`
          : `project-${projectId}.md`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => exportProject("json")}
        className="px-4 py-2 bg-gray-800 text-white rounded"
      >
        Export JSON
      </button>

      <button
        onClick={() => exportProject("markdown")}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Export Markdown
      </button>

      <button
        onClick={() => exportProject("csv")}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Export CSV
      </button>
    </div>
  );
}
