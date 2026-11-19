-- Apply this migration to the existing Supabase project.
-- Public visitors may read the published website settings; writes remain staff-only.
drop policy if exists "public read published website content" on public.website_content;
create policy "public read published website content" on public.website_content
for select to anon, authenticated
using (id = 1);

-- Ensure public image URLs work even if the bucket existed as private before this migration.
update storage.buckets set public = true where id = 'website-assets';

drop policy if exists "public read published image assets" on storage.objects;
create policy "public read published image assets" on storage.objects
for select to anon, authenticated
using (bucket_id = 'website-assets');
