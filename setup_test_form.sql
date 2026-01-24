-- 1. Clear existing data
DELETE FROM public.tracker_audit_item_options;
DELETE FROM public.tracker_audit_items;
DELETE FROM public.tracker_audit_groups;
DELETE FROM public.tracker_audit_forms;

-- 2. Create the Test Form
INSERT INTO public.tracker_audit_forms (id, title, description, status)
VALUES ('77777777-7777-7777-7777-777777777777', 'Automation Test Form', 'Form for testing bookmarklet interactions', 'active');

-- 3. Create 2 Groups
INSERT INTO public.tracker_audit_groups (id, form_id, title, order_index) VALUES
('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Quality Standards', 0),
('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Call Metrics', 1);

-- 4. Create 10 Items
-- Note: order_index is used to match data-idx="1", data-idx="2", etc. on the target page.
INSERT INTO public.tracker_audit_items (id, group_id, question_text, short_name, item_type, is_required, order_index) VALUES
-- Group 1 (Indices 1-5)
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Greeting', 'GREET', 'toggle_custom', true, 1),
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tone', 'TONE', 'toggle_custom', true, 2),
('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Name', 'NAME', 'toggle_custom', true, 3),
('00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Resolution', 'RES', 'toggle_custom', true, 4),
('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Accuracy', 'ACC', 'toggle_custom', true, 5),
-- Group 2 (Indices 6-10)
('00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Complexity', 'COMP', 'dropdown_custom', true, 6),
('00000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Mood', 'MOOD', 'dropdown_custom', true, 7),
('00000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Escalated', 'ESC', 'toggle_custom', true, 8),
('00000000-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'Dead Air', 'DEAD', 'toggle_custom', true, 9),
('00000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'Status', 'STAT', 'dropdown_custom', true, 10);

-- 5. Create Options (Yes, No, N/A) for relevant items
DO $$
DECLARE
    item_ids UUID[] := ARRAY[
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000008',
        '00000000-0000-0000-0000-000000000009'
    ]::UUID[];
    i UUID;
BEGIN
    FOREACH i IN ARRAY item_ids LOOP
        INSERT INTO public.tracker_audit_item_options (item_id, label, is_correct, is_default, color, order_index) VALUES
        (i, 'Yes', true, true, 'success', 0),
        (i, 'No', false, false, 'destructive', 1),
        (i, 'N/A', true, false, 'neutral', 2);
    END LOOP;
END $$;

-- Custom Options for i6, i7, i10
INSERT INTO public.tracker_audit_item_options (item_id, label, is_correct, is_default, color, order_index) VALUES
('00000000-0000-0000-0000-000000000006', 'Low', true, true, 'neutral', 0), 
('00000000-0000-0000-0000-000000000006', 'Medium', true, false, 'neutral', 1), 
('00000000-0000-0000-0000-000000000006', 'High', true, false, 'neutral', 2),

('00000000-0000-0000-0000-000000000007', 'Happy', true, false, 'success', 0), 
('00000000-0000-0000-0000-000000000007', 'Neutral', true, true, 'neutral', 1), 
('00000000-0000-0000-0000-000000000007', 'Upset', false, false, 'destructive', 2),

('00000000-0000-0000-0000-000000000010', 'Resolved', true, true, 'success', 0), 
('00000000-0000-0000-0000-000000000010', 'Pending', true, false, 'neutral', 1), 
('00000000-0000-0000-0000-000000000010', 'Cancelled', false, false, 'destructive', 2);