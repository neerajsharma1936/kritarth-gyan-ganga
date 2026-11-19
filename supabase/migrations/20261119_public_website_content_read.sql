-- Apply this migration to the existing Supabase project.
-- Public visitors may read the published website settings; writes remain staff-only.
drop policy if exists "public read published website content" on public.website_content;
create policy "public read published website content" on public.website_content
for select to anon, authenticated
using (id = 1);
