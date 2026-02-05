-- Assign permissions to roles
DO $$
DECLARE
    view_perm_id UUID;
    manage_perm_id UUID;
    qa_role_id UUID;
    sup_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get permission IDs
    SELECT id INTO view_perm_id FROM public.user_permissions WHERE code = 'assignments.view';
    SELECT id INTO manage_perm_id FROM public.user_permissions WHERE code = 'assignments.manage';

    -- Get role IDs
    SELECT id INTO qa_role_id FROM public.user_roles WHERE name IN ('QA', 'Quality Analyst', 'Quality');
    SELECT id INTO sup_role_id FROM public.user_roles WHERE name IN ('Supervisor', 'Manager', 'Lead');
    SELECT id INTO admin_role_id FROM public.user_roles WHERE name = 'Admin';

    -- Assign assignments.view to QA, Supervisor, Admin
    IF view_perm_id IS NOT NULL THEN
        IF qa_role_id IS NOT NULL THEN
            INSERT INTO public.user_role_permissions (role_id, permission_id) VALUES (qa_role_id, view_perm_id) ON CONFLICT DO NOTHING;
        END IF;
        IF sup_role_id IS NOT NULL THEN
            INSERT INTO public.user_role_permissions (role_id, permission_id) VALUES (sup_role_id, view_perm_id) ON CONFLICT DO NOTHING;
        END IF;
        IF admin_role_id IS NOT NULL THEN
            INSERT INTO public.user_role_permissions (role_id, permission_id) VALUES (admin_role_id, view_perm_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Assign assignments.manage to Supervisor, Admin
    IF manage_perm_id IS NOT NULL THEN
        IF sup_role_id IS NOT NULL THEN
            INSERT INTO public.user_role_permissions (role_id, permission_id) VALUES (sup_role_id, manage_perm_id) ON CONFLICT DO NOTHING;
        END IF;
        IF admin_role_id IS NOT NULL THEN
            INSERT INTO public.user_role_permissions (role_id, permission_id) VALUES (admin_role_id, manage_perm_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
