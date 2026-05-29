-- 52_add_chatbot_info_field_rows.sql
-- Adds configurable textarea height per chatbot information field.

alter table if exists public.chatbot_info_fields
  add column if not exists field_rows integer;

update public.chatbot_info_fields
set field_rows = case
  when field_type = 'textarea' and (
    field_key ilike '%description%' or
    field_key ilike '%address%' or
    field_key ilike '%notes%'
  ) then 3
  when field_type = 'textarea' then 2
  else 1
end
where field_rows is null;

alter table if exists public.chatbot_info_fields
  alter column field_rows set default 1;

alter table if exists public.chatbot_info_fields
  alter column field_rows set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_chatbot_info_fields_rows'
  ) then
    alter table public.chatbot_info_fields
      add constraint chk_chatbot_info_fields_rows
      check (field_rows between 1 and 3);
  end if;
end $$;
