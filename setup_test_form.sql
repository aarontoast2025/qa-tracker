-- 1. Clear existing data
DELETE FROM public.tracker_audit_item_options;
DELETE FROM public.tracker_audit_items;
DELETE FROM public.tracker_audit_groups;
DELETE FROM public.tracker_audit_forms;

-- 2. Create the Test Form
-- Using a valid UUID format
INSERT INTO public.tracker_audit_forms (id, title, description, status)
VALUES ('77777777-7777-7777-7777-777777777777', 'Automation Test Form', 'Form for testing bookmarklet interactions and automation', 'active');

-- 3. Create 2 Groups
INSERT INTO public.tracker_audit_groups (id, form_id, title, order_index) VALUES
('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Quality Standards', 0),
('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Call Metrics', 1);

-- 4. Create 10 Items (5 in each group)
INSERT INTO public.tracker_audit_items (id, group_id, question_text, short_name, item_type, is_required, order_index) VALUES
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Did the agent provide a standard greeting? (Correct: Yes)', 'GREET', 'toggle_yes_no', true, 0),
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Was there any poor tone or attitude? (Correct: No)', 'TONE', 'toggle_yes_no', true, 1),
('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Did the agent use the customer name? (Correct: Yes)', 'NAME', 'toggle_yes_no', true, 2),
('00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Was a resolution provided? (Correct: Yes)', 'RES', 'toggle_yes_no', true, 3),
('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Was the agent rude at any point? (Correct: No)', 'RUDE', 'toggle_yes_no', true, 4),
('00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'What was the call complexity?', 'COMP', 'dropdown_custom', true, 0),
('00000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'What was the customer mood?', 'MOOD', 'dropdown_custom', true, 1),
('00000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Was the call escalated? (Correct: No)', 'ESC', 'toggle_yes_no', true, 2),
('00000000-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'Was there excessive dead air? (Correct: No)', 'DEAD', 'toggle_yes_no', true, 3),
('00000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'What is the final case status?', 'STAT', 'dropdown_custom', true, 4);

-- 5. Create Options for all items
-- i1: Yes(correct), No
INSERT INTO public.tracker_audit_item_options (item_id, label, is_correct, is_default, color, order_index) VALUES
('00000000-0000-0000-0000-000000000001', 'Yes', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000001', 'No', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000002', 'No', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000002', 'Yes', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000003', 'Yes', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000003', 'No', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000004', 'Yes', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000004', 'No', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000005', 'No', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000005', 'Yes', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000006', 'Low', true, true, 'neutral', 0),
('00000000-0000-0000-0000-000000000006', 'Medium', true, false, 'neutral', 1),
('00000000-0000-0000-0000-000000000006', 'High', true, false, 'neutral', 2),
('00000000-0000-0000-0000-000000000007', 'Happy', true, false, 'success', 0),
('00000000-0000-0000-0000-000000000007', 'Neutral', true, true, 'neutral', 1),
('00000000-0000-0000-0000-000000000007', 'Upset', false, false, 'destructive', 2),
('00000000-0000-0000-0000-000000000008', 'No', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000008', 'Yes', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000009', 'No', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000009', 'Yes', false, false, 'destructive', 1),
('00000000-0000-0000-0000-000000000010', 'Resolved', true, true, 'success', 0),
('00000000-0000-0000-0000-000000000010', 'Pending', true, false, 'neutral', 1),
('00000000-0000-0000-0000-000000000010', 'Cancelled', false, false, 'destructive', 2);