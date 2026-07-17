-- Client accounts, protected portal access, and studio administration.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.enquiries add column if not exists client_id uuid references auth.users(id) on delete set null;
create index if not exists enquiries_client_id_idx on public.enquiries(client_id);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Accounts created before this migration also get a standard client profile.
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', '') from auth.users
on conflict (id) do nothing;

create schema if not exists security;
create or replace function security.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Clients can view their enquiries" on public.enquiries;
create policy "Clients can view their enquiries" on public.enquiries for select to authenticated
using (client_id = (select auth.uid()) or (select security.is_admin()));

-- Replace the original broad insert policy. Anonymous visitors can submit a basic
-- enquiry; signed-in users may only attach the enquiry to their own account.
drop policy if exists "Anyone can submit an enquiry" on public.enquiries;
create policy "Visitors can submit an enquiry" on public.enquiries for insert to anon with check (true);

drop policy if exists "Clients can create linked enquiries" on public.enquiries;
create policy "Clients can create linked enquiries" on public.enquiries for insert to authenticated
with check (client_id = (select auth.uid()));

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries" on public.enquiries for update to authenticated
using ((select security.is_admin())) with check ((select security.is_admin()));

create or replace function public.cancel_own_enquiry(p_enquiry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.enquiries set status = 'declined'
  where id = p_enquiry_id and client_id = (select auth.uid());
end; $$;
grant execute on function public.cancel_own_enquiry(uuid) to authenticated;

-- After creating your own account in the portal, promote it by changing the email below,
-- then run this one statement in the SQL Editor:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your-email@example.com');
