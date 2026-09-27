-- 111_website_site_guide.sql
-- Website chatbot site guide: pages, sections, and which TourBots tour
-- embed sits on which page. Empty catalogues leave website bots unchanged.
-- Run after 110_fix_mark_apollo3d_stale_stripe_customer.sql.

begin;

create table if not exists public.website_site_guides (
  chatbot_config_id uuid primary key,
  venue_id uuid not null,
  site_origin text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_website_site_guides_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade,
  constraint fk_website_site_guides_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_website_site_guides_origin
    check (site_origin ~ '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$')
);

create table if not exists public.website_site_pages (
  id uuid primary key default gen_random_uuid(),
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  title text not null,
  path text not null,
  description text,
  sort_order integer not null default 0,
  tour_id uuid,
  tour_iframe_selector text,
  handoff_mode text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_website_site_pages_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade,
  constraint fk_website_site_pages_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint fk_website_site_pages_tour
    foreign key (tour_id) references public.tours(id)
    on delete set null,
  constraint chk_website_site_pages_path
    check (
      path ~ '^/'
      and path !~ '://'
      and path !~ '\\\\'
      and char_length(path) <= 500
    ),
  constraint chk_website_site_pages_handoff
    check (handoff_mode in ('none', 'open_chat', 'pass_question')),
  constraint chk_website_site_pages_title
    check (char_length(btrim(title)) between 1 and 120)
);

create table if not exists public.website_site_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null,
  chatbot_config_id uuid not null,
  venue_id uuid not null,
  title text not null,
  anchor text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_website_site_sections_page
    foreign key (page_id) references public.website_site_pages(id)
    on delete cascade,
  constraint fk_website_site_sections_config
    foreign key (chatbot_config_id) references public.chatbot_configs(id)
    on delete cascade,
  constraint fk_website_site_sections_venue
    foreign key (venue_id) references public.venues(id)
    on delete cascade,
  constraint chk_website_site_sections_anchor
    check (char_length(btrim(anchor)) between 1 and 200),
  constraint chk_website_site_sections_title
    check (char_length(btrim(title)) between 1 and 120)
);

create index if not exists idx_website_site_pages_config
  on public.website_site_pages(chatbot_config_id, sort_order);
create index if not exists idx_website_site_sections_page
  on public.website_site_sections(page_id, sort_order);
create index if not exists idx_website_site_guides_venue
  on public.website_site_guides(venue_id);

alter table public.website_site_guides enable row level security;
alter table public.website_site_pages enable row level security;
alter table public.website_site_sections enable row level security;

drop policy if exists service_role_all_website_site_guides on public.website_site_guides;
create policy service_role_all_website_site_guides
  on public.website_site_guides
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_website_site_pages on public.website_site_pages;
create policy service_role_all_website_site_pages
  on public.website_site_pages
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_website_site_sections on public.website_site_sections;
create policy service_role_all_website_site_sections
  on public.website_site_sections
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table
  public.website_site_guides,
  public.website_site_pages,
  public.website_site_sections
from anon, authenticated;

grant select, insert, update, delete on table
  public.website_site_guides,
  public.website_site_pages,
  public.website_site_sections
to service_role;

create or replace function public.replace_website_site_guide(
  p_chatbot_config_id uuid,
  p_venue_id uuid,
  p_site_origin text,
  p_enabled boolean,
  p_pages jsonb
)
returns void
language plpgsql
as $$
declare
  v_page jsonb;
  v_section jsonb;
  v_page_id uuid;
  v_tour_id uuid;
  v_sort integer := 0;
  v_section_sort integer;
  v_path text;
  v_handoff text;
begin
  if jsonb_typeof(p_pages) <> 'array' then
    raise exception 'p_pages must be a JSON array';
  end if;
  if jsonb_array_length(p_pages) > 40 then
    raise exception 'A site guide can list at most 40 pages';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_chatbot_config_id::text));

  perform 1
  from public.chatbot_configs
  where id = p_chatbot_config_id
    and venue_id = p_venue_id
    and chatbot_type = 'website'
  for update;

  if not found then
    raise exception 'Website chatbot configuration not found in the requested scope';
  end if;

  if p_site_origin !~ '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' then
    raise exception 'Site origin must be an http or https origin';
  end if;

  delete from public.website_site_pages
  where chatbot_config_id = p_chatbot_config_id;

  insert into public.website_site_guides (
    chatbot_config_id,
    venue_id,
    site_origin,
    enabled,
    updated_at
  )
  values (
    p_chatbot_config_id,
    p_venue_id,
    p_site_origin,
    coalesce(p_enabled, true),
    now()
  )
  on conflict (chatbot_config_id) do update set
    site_origin = excluded.site_origin,
    enabled = excluded.enabled,
    venue_id = excluded.venue_id,
    updated_at = now();

  for v_page in
    select value
    from jsonb_array_elements(p_pages)
  loop
    v_path := btrim(coalesce(v_page->>'path', ''));
    v_handoff := coalesce(nullif(btrim(v_page->>'handoff_mode'), ''), 'none');
    v_tour_id := nullif(btrim(coalesce(v_page->>'tour_id', '')), '')::uuid;

    if v_path !~ '^/' or v_path ~ '://' or char_length(v_path) > 500 then
      raise exception 'Each page path must start with / and stay on the site';
    end if;
    if v_handoff not in ('none', 'open_chat', 'pass_question') then
      raise exception 'Unsupported handoff mode';
    end if;
    if char_length(btrim(coalesce(v_page->>'title', ''))) < 1 then
      raise exception 'Each page needs a title';
    end if;

    if v_tour_id is not null then
      perform 1
      from public.tours
      where id = v_tour_id
        and venue_id = p_venue_id
        and is_active = true;
      if not found then
        raise exception 'Tour is not an active tour for this account';
      end if;
    end if;

    if jsonb_typeof(v_page->'sections') = 'array'
      and jsonb_array_length(v_page->'sections') > 12 then
      raise exception 'A page can list at most 12 sections';
    end if;

    insert into public.website_site_pages (
      chatbot_config_id,
      venue_id,
      title,
      path,
      description,
      sort_order,
      tour_id,
      tour_iframe_selector,
      handoff_mode
    )
    values (
      p_chatbot_config_id,
      p_venue_id,
      btrim(v_page->>'title'),
      v_path,
      nullif(btrim(coalesce(v_page->>'description', '')), ''),
      v_sort,
      v_tour_id,
      nullif(btrim(coalesce(v_page->>'tour_iframe_selector', '')), ''),
      v_handoff
    )
    returning id into v_page_id;

    v_sort := v_sort + 1;
    v_section_sort := 0;

    if jsonb_typeof(v_page->'sections') = 'array' then
      for v_section in
        select value
        from jsonb_array_elements(v_page->'sections')
      loop
        if char_length(btrim(coalesce(v_section->>'title', ''))) < 1
          or char_length(btrim(coalesce(v_section->>'anchor', ''))) < 1 then
          raise exception 'Each section needs a title and an anchor';
        end if;

        insert into public.website_site_sections (
          page_id,
          chatbot_config_id,
          venue_id,
          title,
          anchor,
          description,
          sort_order
        )
        values (
          v_page_id,
          p_chatbot_config_id,
          p_venue_id,
          btrim(v_section->>'title'),
          btrim(v_section->>'anchor'),
          nullif(btrim(coalesce(v_section->>'description', '')), ''),
          v_section_sort
        );
        v_section_sort := v_section_sort + 1;
      end loop;
    end if;
  end loop;
end;
$$;

revoke all on function public.replace_website_site_guide(uuid, uuid, text, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_website_site_guide(uuid, uuid, text, boolean, jsonb)
  to service_role;

commit;
