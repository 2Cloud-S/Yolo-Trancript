-- Add quality control fields to transcriptions table
alter table public.transcriptions 
  add column if not exists quality_score smallint check (quality_score >= 1 and quality_score <= 5),
  add column if not exists reviewed boolean default false,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists reviewer_notes text;

-- Create index for quality control queries
create index if not exists transcriptions_reviewed_idx on public.transcriptions(reviewed);
create index if not exists transcriptions_quality_score_idx on public.transcriptions(quality_score);

-- Create view for quality control metrics
create or replace view public.quality_control_metrics as
select
  user_id,
  count(*) as total_transcriptions,
  count(*) filter (where reviewed) as reviewed_transcriptions,
  count(*) filter (where not reviewed) as pending_reviews,
  avg(quality_score) filter (where quality_score is not null)::numeric(3,2) as average_quality_score,
  count(*) filter (where status = 'failed') as failed_transcriptions,
  count(*) filter (where status = 'completed') as completed_transcriptions
from public.transcriptions
group by user_id;

-- Grant access to the view
grant select on public.quality_control_metrics to authenticated; 