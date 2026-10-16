-- افزونهٔ پیام‌رسان مدرسهٔ من
-- این فایل را یک‌بار در Supabase SQL Editor اجرا کنید. کلید service_role را هرگز در سایت قرار ندهید.
create extension if not exists pgcrypto;

create table if not exists public.school_chat_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text not null default '' check (char_length(description) <= 240),
  kind text not null default 'school' check (kind in ('school','teachers','managers')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);
create table if not exists public.school_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.school_chat_channels(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists school_chat_messages_channel_created_idx on public.school_chat_messages(channel_id, created_at desc);
create table if not exists public.school_chat_reads (
  channel_id uuid not null references public.school_chat_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key(channel_id,user_id)
);
create table if not exists public.school_chat_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.school_chat_messages(id) on delete cascade,
  channel_id uuid references public.school_chat_channels(id) on delete cascade,
  title text not null default 'پیام جدید',
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists school_chat_notifications_user_idx on public.school_chat_notifications(user_id, created_at desc);

create or replace function public.school_chat_role() returns text language sql stable security definer set search_path=public as $$
  select lower(coalesce(role,'')) from public.profiles where id=auth.uid() limit 1;
$$;
create or replace function public.school_chat_can_read_channel(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.school_chat_channels c where c.id=cid and not c.archived and (
    c.kind='school' or (c.kind='teachers' and public.school_chat_role() in ('teacher','manager')) or (c.kind='managers' and public.school_chat_role()='manager')
  ));
$$;

alter table public.school_chat_channels enable row level security;
alter table public.school_chat_messages enable row level security;
alter table public.school_chat_reads enable row level security;
alter table public.school_chat_notifications enable row level security;

drop policy if exists school_chat_channels_read on public.school_chat_channels;
create policy school_chat_channels_read on public.school_chat_channels for select to authenticated using (
 archived=false and (kind='school' or (kind='teachers' and public.school_chat_role() in ('teacher','manager')) or (kind='managers' and public.school_chat_role()='manager'))
);
drop policy if exists school_chat_channels_create on public.school_chat_channels;
create policy school_chat_channels_create on public.school_chat_channels for insert to authenticated with check (
 created_by=auth.uid() and public.school_chat_role() in ('manager','teacher') and
 (kind='school' or (kind='teachers' and public.school_chat_role() in ('manager','teacher')) or (kind='managers' and public.school_chat_role()='manager'))
);
drop policy if exists school_chat_channels_update on public.school_chat_channels;
create policy school_chat_channels_update on public.school_chat_channels for update to authenticated using (public.school_chat_role()='manager' or created_by=auth.uid()) with check (public.school_chat_role()='manager' or created_by=auth.uid());

drop policy if exists school_chat_messages_read on public.school_chat_messages;
create policy school_chat_messages_read on public.school_chat_messages for select to authenticated using (public.school_chat_can_read_channel(channel_id));
drop policy if exists school_chat_messages_send on public.school_chat_messages;
create policy school_chat_messages_send on public.school_chat_messages for insert to authenticated with check (sender_id=auth.uid() and public.school_chat_can_read_channel(channel_id));
drop policy if exists school_chat_messages_edit on public.school_chat_messages;
create policy school_chat_messages_edit on public.school_chat_messages for update to authenticated using (sender_id=auth.uid() or public.school_chat_role()='manager') with check (sender_id=auth.uid() or public.school_chat_role()='manager');
drop policy if exists school_chat_messages_delete on public.school_chat_messages;
create policy school_chat_messages_delete on public.school_chat_messages for delete to authenticated using (sender_id=auth.uid() or public.school_chat_role()='manager');

drop policy if exists school_chat_reads_own on public.school_chat_reads;
create policy school_chat_reads_own on public.school_chat_reads for all to authenticated using (user_id=auth.uid() and public.school_chat_can_read_channel(channel_id)) with check (user_id=auth.uid() and public.school_chat_can_read_channel(channel_id));
drop policy if exists school_chat_notifications_own on public.school_chat_notifications;
create policy school_chat_notifications_own on public.school_chat_notifications for select to authenticated using (user_id=auth.uid());
drop policy if exists school_chat_notifications_update_own on public.school_chat_notifications;
create policy school_chat_notifications_update_own on public.school_chat_notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- اعلان‌ها را فقط برای اعضای مجاز همان کانال ایجاد می‌کند؛ با حذف پیام حذف می‌شوند.
create or replace function public.school_chat_notify_new_message() returns trigger language plpgsql security definer set search_path=public as $$
declare cname text; sender text;
begin
 select name into cname from public.school_chat_channels where id=new.channel_id;
 select coalesce(full_name,username,'عضو مدرسه') into sender from public.profiles where id=new.sender_id;
 insert into public.school_chat_notifications(user_id,message_id,channel_id,title,body)
 select p.id,new.id,new.channel_id,'پیام جدید در «'||coalesce(cname,'گفت‌وگو')||'»',left(coalesce(sender,'عضو مدرسه')||': '||new.body,180)
 from public.profiles p
 where p.id<>new.sender_id and (
   exists(select 1 from public.school_chat_channels c where c.id=new.channel_id and c.kind='school' and lower(p.role) in ('manager','teacher','student','parent','guardian')) or
   exists(select 1 from public.school_chat_channels c where c.id=new.channel_id and c.kind='teachers' and lower(p.role) in ('manager','teacher')) or
   exists(select 1 from public.school_chat_channels c where c.id=new.channel_id and c.kind='managers' and lower(p.role)='manager')
 );
 return new;
end; $$;
drop trigger if exists school_chat_notify_message on public.school_chat_messages;
create trigger school_chat_notify_message after insert on public.school_chat_messages for each row execute function public.school_chat_notify_new_message();

insert into public.school_chat_channels(name,description,kind,created_by)
select 'گفت‌وگوی عمومی مدرسه','گفت‌وگوی مشترک اعضای مدرسه','school',p.id from public.profiles p where lower(p.role)='manager'
and not exists(select 1 from public.school_chat_channels where name='گفت‌وگوی عمومی مدرسه');
insert into public.school_chat_channels(name,description,kind,created_by)
select 'اتاق معلمان','گفت‌وگوی مخصوص معلمان و مدیر','teachers',p.id from public.profiles p where lower(p.role)='manager'
and not exists(select 1 from public.school_chat_channels where name='اتاق معلمان');
insert into public.school_chat_channels(name,description,kind,created_by)
select 'مدیریت','گفت‌وگوی ویژهٔ مدیران','managers',p.id from public.profiles p where lower(p.role)='manager'
and not exists(select 1 from public.school_chat_channels where name='مدیریت');

do $$ begin
  alter publication supabase_realtime add table public.school_chat_messages;
exception when duplicate_object then null; when undefined_object then null; end $$;
grant select,insert,update,delete on public.school_chat_channels to authenticated;
grant select,insert,update,delete on public.school_chat_messages to authenticated;
grant select,insert,update,delete on public.school_chat_reads to authenticated;
grant select,update on public.school_chat_notifications to authenticated;
