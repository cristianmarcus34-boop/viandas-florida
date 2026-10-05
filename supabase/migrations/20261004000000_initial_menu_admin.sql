create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  description text not null default '' check (length(description) <= 500),
  category text not null check (length(trim(category)) between 2 and 40),
  price integer not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 100),
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_menus_valid_dates check (end_date >= start_date)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.weekly_menus (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  price_override integer check (price_override is null or price_override >= 0),
  sort_order integer not null default 0,
  is_available boolean not null default true,
  unique (menu_id, product_id)
);

create index weekly_menus_public_idx on public.weekly_menus (status, start_date, end_date);
create index menu_items_menu_order_idx on public.menu_items (menu_id, sort_order);
create index menu_items_product_idx on public.menu_items (product_id);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create function public.save_weekly_menu(
  p_id uuid,
  p_title text,
  p_start_date date,
  p_end_date date,
  p_status text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acceso administrativo requerido';
  end if;
  if length(trim(p_title)) not between 2 and 100 then
    raise exception 'El título debe tener entre 2 y 100 caracteres';
  end if;
  if p_end_date < p_start_date then
    raise exception 'La fecha de fin debe ser igual o posterior al inicio';
  end if;
  if p_status not in ('draft', 'published', 'archived') then
    raise exception 'Estado de menú inválido';
  end if;
  if p_status = 'published' and exists (
    select 1 from public.weekly_menus wm
    where wm.id <> p_id
      and wm.status = 'published'
      and daterange(wm.start_date, wm.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Ya hay otro menú publicado que se superpone con esas fechas';
  end if;
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Los platos del menú no son válidos';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Un menú publicado o guardado debe incluir al menos un plato';
  end if;

  insert into public.weekly_menus (id, title, start_date, end_date, status, published_at, updated_at)
  values (
    p_id, trim(p_title), p_start_date, p_end_date, p_status,
    case when p_status = 'published' then now() else null end, now()
  )
  on conflict (id) do update set
    title = excluded.title,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    status = excluded.status,
    published_at = case
      when excluded.status = 'published' then coalesce(weekly_menus.published_at, now())
      else null
    end,
    updated_at = now()
  returning id into saved_id;

  delete from public.menu_items
  where menu_id = saved_id
    and product_id not in (
      select (item ->> 'product_id')::uuid from jsonb_array_elements(p_items) as item
    );

  insert into public.menu_items (menu_id, product_id, price_override, sort_order)
  select
    saved_id,
    (item ->> 'product_id')::uuid,
    nullif(nullif(item ->> 'price_override', ''), 'null')::integer,
    (item ->> 'sort_order')::integer
  from jsonb_array_elements(p_items) as item
  on conflict (menu_id, product_id) do update set
    price_override = excluded.price_override,
    sort_order = excluded.sort_order;

  return saved_id;
end;
$$;

revoke all on function public.save_weekly_menu(uuid, text, date, date, text, jsonb) from public;
grant execute on function public.save_weekly_menu(uuid, text, date, date, text, jsonb) to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.weekly_menus enable row level security;
alter table public.menu_items enable row level security;

create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read products in current published menus"
  on public.products for select to anon, authenticated
  using (
    exists (
      select 1
      from public.menu_items mi
      join public.weekly_menus wm on wm.id = mi.menu_id
      where mi.product_id = products.id
        and mi.is_available
        and wm.status = 'published'
        and (now() at time zone 'America/Argentina/Buenos_Aires')::date between wm.start_date and wm.end_date
        and products.is_active
    )
  );

create policy "Admins can manage weekly menus"
  on public.weekly_menus for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read current published menus"
  on public.weekly_menus for select to anon, authenticated
  using (
    status = 'published'
    and (now() at time zone 'America/Argentina/Buenos_Aires')::date between start_date and end_date
  );

create policy "Admins can manage menu items"
  on public.menu_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Public can read available items in current published menus"
  on public.menu_items for select to anon, authenticated
  using (
    is_available
    and exists (
      select 1 from public.weekly_menus wm
      where wm.id = menu_items.menu_id
        and wm.status = 'published'
        and (now() at time zone 'America/Argentina/Buenos_Aires')::date between wm.start_date and wm.end_date
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images', 'dish-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can view dish images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'dish-images');

create policy "Admins can upload dish images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'dish-images' and public.is_admin());

create policy "Admins can update dish images"
  on storage.objects for update to authenticated
  using (bucket_id = 'dish-images' and public.is_admin())
  with check (bucket_id = 'dish-images' and public.is_admin());

create policy "Admins can delete dish images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'dish-images' and public.is_admin());
