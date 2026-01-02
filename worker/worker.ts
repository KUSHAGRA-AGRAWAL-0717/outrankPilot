import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EDGE_FUNCTION_BASE_URL = `${process.env.SUPABASE_URL}/functions/v1`;

/**
 * Poll an available pending job and lock it as "processing"
 */
async function pollSupabaseQueue(jobType: string): Promise<{ id: string; payload: any } | null> {
  try {
    const { data: job, error } = await supabase
      .from("job_logs")
      .select("id, payload")
      .eq("job_type", jobType)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !job) return null;

    // Try to mark it processing (race safe)
    const { data: lockedJob } = await supabase
      .from("job_logs")
      .update({ status: "processing" })
      .eq("id", job.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    return lockedJob ? { id: lockedJob.id, payload: lockedJob.payload } : null;
  } catch (err) {
    console.error(`Queue poll error (${jobType}):`, err);
    return null;
  }
}

/**
 * Mark job as completed/failed from the worker
 */
async function markJobCompleted(jobId: string, result: { status?: string; error?: string } = {}) {
  await supabase
    .from("job_logs")
    .update({ status: result.status ?? "completed", error: result.error ?? null, completed_at: new Date() })
    .eq("id", jobId);
}

/**
 * Universal dispatcher - calls Edge Function named EXACTLY like jobType
 */
async function dispatchTask(jobType: string) {
  const job = await pollSupabaseQueue(jobType);
  if (!job) return;

 

  console.log(`🚀 Dispatching ${jobType} -> ${EDGE_FUNCTION_BASE_URL}/${jobType} (job ${job.id})`);

  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/${jobType}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job.payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Edge function returned ${response.status}: ${text}`);
    }

    // success
    await markJobCompleted(job.id, { status: "completed" });
    console.log(`✅ ${jobType} finished successfully for job ${job.id}`);
  } catch (error: any) {
    console.error(`❌ Dispatch failed for ${jobType} (job ${job.id}):`, error.message);
    await markJobCompleted(job.id, { status: "failed", error: error.message });
  }
}

/* ---------------- start dispatch loops ---------------- */
setInterval(() => dispatchTask("analyze-keywords"), 3000);
setInterval(() => dispatchTask("generate-brief"), 3000);
setInterval(() => dispatchTask("publish"), 5000);
setInterval(() => dispatchTask("rankings"), 5000);
setInterval(() => dispatchTask("project-stats"), 8000);
setInterval(() => dispatchTask("analyze-competitor"), 4000);
setInterval(() => dispatchTask("autopilot"), 10_000);


/* ---------------- helper to add jobs (used by cron below) ---------------- */
async function addJobToQueue(jobType: string, payload: any) {
  await supabase.from("job_logs").insert({
    job_type: jobType,
    payload,
    status: "pending",
  });
}

/* ---------------- cron triggers to enqueue jobs (keeps your existing cron behavior) ---------------- */
import cron from "node-cron";

/* Autopilot - add analyze-keywords jobs for projects with autopilot_enabled */
cron.schedule("0 * * * *", async () => {
  const { data: projects } = await supabase.from("projects").select("id, user_id").eq("autopilot_enabled", true);
  for (const p of projects ?? []) {
    await addJobToQueue("analyze-keywords", { project_id: p.id, user_id: p.user_id });
  }
});

/* Periodic rankings trigger */
cron.schedule("0 * * * *", async () => {
  const { data: projects } = await supabase.from("projects").select("id");
  for (const p of projects ?? []) {
    await addJobToQueue("rankings", { project_id: p.id });
  }
});

/* Periodic project stats trigger */
cron.schedule("0 */6 * * *", async () => {
  await addJobToQueue("project-stats", { trigger: "periodic" });
});

cron.schedule("0 * * * *", async () => {
  await addJobToQueue("autopilot", {
    trigger: "hourly",
  });
});

console.log("🚀 Supabase Worker Service Started (Dispatcher mode)");
