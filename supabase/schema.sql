-- Noir & Light Studio: initial booking-enquiry schema
-- Run this entire file once in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 255),
  service text not null check (service in ('Wedding', 'Editorial events', 'Portraits', 'Something else')),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'replied', 'consultation', 'booked', 'declined'))
);

alter table public.enquiries enable row level security;

-- Visitors can submit an enquiry but cannot read, edit or delete any enquiries.
create policy "Anyone can submit an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

-- The constraint is recreated so the script also works with the current service list.
alter table public.enquiries drop constraint if exists enquiries_service_check;
alter table public.enquiries add constraint enquiries_service_check
  check (service in ('Wedding', 'Editorial events', 'Portraits', 'Something else'));
