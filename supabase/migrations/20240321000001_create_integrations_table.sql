-- Create integrations table
create table if not exists public.integrations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('connected', 'disconnected')),
  connected_at timestamp with time zone,
  last_sync timestamp with time zone,
  settings jsonb default '{"auto_save": true, "folder_path": "/Transcriptions", "sync_frequency": "realtime"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists integrations_user_id_idx on public.integrations(user_id);
create index if not exists integrations_provider_idx on public.integrations(provider);

-- Enable RLS
alter table public.integrations enable row level security;

-- Create policies
create policy "Users can view their own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on public.integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.integrations for delete
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
  before update on public.integrations
  for each row
  execute function public.handle_updated_at(); 