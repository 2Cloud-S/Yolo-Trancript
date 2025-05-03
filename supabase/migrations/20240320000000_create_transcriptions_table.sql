-- Create transcriptions table
create table if not exists public.transcriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
    duration integer, -- duration in seconds
    file_name text,
    file_size integer,
    file_type text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    error_message text,
    transcription_text text,
    metadata jsonb default '{}'::jsonb
);

-- Create index for faster queries
create index transcriptions_user_id_idx on public.transcriptions(user_id);
create index transcriptions_created_at_idx on public.transcriptions(created_at);
create index transcriptions_status_idx on public.transcriptions(status);

-- Enable Row Level Security
alter table public.transcriptions enable row level security;

-- Create policies
create policy "Users can view their own transcriptions"
    on public.transcriptions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own transcriptions"
    on public.transcriptions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own transcriptions"
    on public.transcriptions for update
    using (auth.uid() = user_id);

-- Create function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
    before update on public.transcriptions
    for each row
    execute function public.handle_updated_at();

-- Create view for analytics
create or replace view public.transcription_analytics as
select
    user_id,
    date_trunc('day', created_at) as date,
    count(*) as total_transcriptions,
    count(*) filter (where status = 'completed') as completed_transcriptions,
    count(*) filter (where status = 'failed') as failed_transcriptions,
    sum(duration) as total_duration,
    avg(duration) filter (where status = 'completed') as average_duration
from public.transcriptions
group by user_id, date_trunc('day', created_at);

-- Grant access to the view
grant select on public.transcription_analytics to authenticated; 