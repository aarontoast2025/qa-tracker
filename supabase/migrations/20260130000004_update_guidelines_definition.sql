-- Update guidelines table to support structured definition
alter table public.guidelines 
alter column description type jsonb using description::jsonb;

-- Default value for description if needed
update public.guidelines set description = '[]'::jsonb where description is null;
