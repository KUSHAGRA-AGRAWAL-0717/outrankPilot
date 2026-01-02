import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const { data: pendingJobs, error } = await supabase
    .from('job_logs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(5)  // Free tier batching

  if (error || !pendingJobs?.length) return new Response('No jobs', { status: 200 })

  for (const job of pendingJobs) {
    try {
      await supabase.from('job_logs').update({ status: 'processing' }).eq('id', job.id)

      // Map job_type to edge func (match your jobs/)
      let funcUrl = ''
      let payload = job.payload || {}
      switch (job.job_type) {
        case 'generateBrief': funcUrl = '/functions/v1/generate-brief'; break
        case 'projectStats': funcUrl = '/functions/v1/compute-project-stats'; break
        case 'publish': funcUrl = '/functions/v1/publish-to-wordpress'; break
        case 'rankings': funcUrl = '/functions/v1/track-rankings'; break
        default: throw new Error('Unknown job_type')
      }

      const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}${funcUrl}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify(payload)
      })

      const result = await resp.json()
      await supabase.from('job_logs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        payload: { ...job.payload, result }
      }).eq('id', job.id)

    } catch (err) {
      await supabase.from('job_logs').update({
        status: 'failed',
        error: err.message,
        completed_at: new Date().toISOString()
      }).eq('id', job.id)
    }
  }

  return new Response('Jobs processed', { status: 200 })
})
