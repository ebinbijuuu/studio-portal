-- Run this once if you ran the original schema before Editorial events was added.
alter table public.enquiries drop constraint if exists enquiries_service_check;
alter table public.enquiries add constraint enquiries_service_check
  check (service in ('Wedding', 'Editorial events', 'Portraits', 'Something else'));
