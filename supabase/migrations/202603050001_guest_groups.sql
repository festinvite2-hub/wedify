create table if not exists public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (wedding_id, name)
);

alter table public.guests
  add column if not exists group_id uuid references public.guest_groups(id) on delete set null;

insert into public.guest_groups (wedding_id, name, sort_order)
select w.id, g.name, g.sort_order
from public.weddings w
cross join lateral (
  select unnest(coalesce(w.groups, array['Familie Mireasă','Familie Mire','Prieteni','Colegi'])) as name,
         generate_subscripts(coalesce(w.groups, array['Familie Mireasă','Familie Mire','Prieteni','Colegi']), 1) - 1 as sort_order
) g
on conflict (wedding_id, name) do nothing;

insert into public.guest_groups (wedding_id, name, sort_order)
select distinct gu.wedding_id, coalesce(nullif(trim(gu."group"), ''), 'Altele') as name, 999
from public.guests gu
left join public.guest_groups gg
  on gg.wedding_id = gu.wedding_id
 and gg.name = coalesce(nullif(trim(gu."group"), ''), 'Altele')
where gg.id is null;

update public.guests gu
set group_id = gg.id
from public.guest_groups gg
where gu.wedding_id = gg.wedding_id
  and gg.name = coalesce(nullif(trim(gu."group"), ''), 'Altele')
  and gu.group_id is null;

alter table public.guest_groups enable row level security;

drop policy if exists "guest_groups_authenticated_rw" on public.guest_groups;
create policy "guest_groups_authenticated_rw"
on public.guest_groups
for all
to authenticated
using (wedding_id = my_wedding_id())
with check (wedding_id = my_wedding_id());
