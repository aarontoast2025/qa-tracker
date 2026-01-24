# Supabase Row Level Security (RLS) Policies Documentation

This document provides a comprehensive overview of all RLS policies currently implemented in the QA Tracker application.

## Table of Contents
- [user_chats Table](#user_chats-table)
- [user_profiles Table](#user_profiles-table)
- [user_roles Table](#user_roles-table)
- [user_role_permissions Table](#user_role_permissions-table)
- [user_direct_permissions Table](#user_direct_permissions-table)
- [user_permissions Table](#user_permissions-table)
- [roster_employees Table](#roster_employees-table)
- [cron.job Table](#cronjob-table)
- [cron.job_run_details Table](#cronjob_run_details-table)
- [storage.objects Table](#storageobjects-table)
=======

---

## user_chats Table

**Purpose**: Stores chat messages between users in the application.

### Policies

#### 1. Users can view their own chats
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to read messages where they are either the sender or receiver
- **SQL**:
```sql
((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = receiver_id))
```

#### 2. Users can insert their own chats
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to insert messages where they are the sender
- **SQL**:
```sql
(( SELECT auth.uid() AS uid) = sender_id)
```

#### 3. Users can update their own chats
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to update only their own sent messages
- **SQL (USING)**:
```sql
((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = receiver_id))
```
- **SQL (WITH CHECK)**:
```sql
((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = receiver_id))
```

#### 4. Users can delete their own messages
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to delete only their own sent messages
- **SQL**:
```sql
((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = receiver_id))
```

---

## user_profiles Table

**Purpose**: Stores user profile information including names, emails, and other user details.

### Policies

#### 1. Authenticated users can view all profiles
- **Type**: SELECT
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows all authenticated users to view user profiles. This is required for features like the global chat and user lists.
- **SQL**: `true`

#### 2. Profiles are updatable by owner or admins
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to update their own profile OR allows admins to update any profile
- **SQL (USING)**:
```sql
((( SELECT auth.uid() AS uid) = id) OR has_role('Admin'::text))
```
- **SQL (WITH CHECK)**:
```sql
(has_role('Admin'::text) OR ((( SELECT auth.uid() AS uid) = id) 
AND ((role_id = get_my_role_id()) OR (role_id IS NULL))))
```

#### 3. Profiles can be inserted by owner or admins
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows users to insert their own profile OR allows admins to insert any profile
- **SQL (WITH CHECK)**:
```sql
((( SELECT auth.uid() AS uid) = id) OR has_role('Admin'::text))
```

#### 4. Only admins can delete profiles
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can delete user profiles
- **SQL**:
```sql
has_role('Admin'::text)
```

---

## user_roles Table

**Purpose**: Stores the available roles in the system (e.g., Admin, User, etc.).

### Policies

#### 1. User roles access policy
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows all authenticated users to view available roles
- **SQL**:
```sql
(( SELECT auth.role() AS role) = 'authenticated'::text)
```

#### 2. Users with roles.add can insert roles
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.add' permission can create new roles
- **SQL (WITH CHECK)**:
```sql
has_permission('roles.add')
```

#### 3. Users with roles.update can update roles
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.update' permission can update roles
- **SQL**:
```sql
has_permission('roles.update')
```

#### 4. Users with roles.delete can delete roles
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.delete' permission can delete roles
- **SQL**:
```sql
has_permission('roles.delete')
```

---

## user_role_permissions Table

**Purpose**: Junction table that links roles to permissions (many-to-many relationship).

### Policies

#### 1. User role permissions access policy
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows all authenticated users to view role-permission mappings
- **SQL**:
```sql
(( SELECT auth.role() AS role) = 'authenticated'::text)
```

#### 2. Users with roles.permission can insert role permissions
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.permission' can assign permissions to roles
- **SQL (WITH CHECK)**:
```sql
has_permission('roles.permission')
```

#### 3. Users with roles.permission can update role permissions
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.permission' can update role permissions
- **SQL**:
```sql
has_permission('roles.permission')
```

#### 4. Users with roles.permission can delete role permissions
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Users with 'roles.permission' can remove permissions from roles
- **SQL**:
```sql
has_permission('roles.permission')
```

### Atomic Updates (RPC)
A database function `update_role_permissions_atomic` is used to safely update permissions in a single transaction. This prevents data loss where permissions could be deleted but not re-inserted due to an error.

---

---

## user_direct_permissions Table

**Purpose**: Stores direct permissions assigned to individual users (overrides role-based permissions).

### Policies

#### 1. User direct permissions access policy
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows all authenticated users to view direct permissions
- **SQL**:
```sql
(( SELECT auth.role() AS role) = 'authenticated'::text)
```

#### 2. Admins can insert direct permissions
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can assign direct permissions to users
- **SQL (WITH CHECK)**:
```sql
has_role('Admin'::text)
```

#### 3. Admins can update direct permissions
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can update direct permissions
- **SQL**:
```sql
has_role('Admin'::text)
```

#### 4. Admins can delete direct permissions
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can remove direct permissions
- **SQL**:
```sql
has_role('Admin'::text)
```

---

## user_permissions Table

**Purpose**: Stores the master list of all available permissions in the system.

### Policies

#### 1. User permissions access policy
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows all authenticated users to view available permissions
- **SQL**:
```sql
(( SELECT auth.role() AS role) = 'authenticated'::text)
```

#### 2. Admins can insert permissions
- **Type**: INSERT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can create new permissions
- **SQL (WITH CHECK)**:
```sql
has_role('Admin'::text)
```

#### 3. Admins can update permissions
- **Type**: UPDATE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can update permissions
- **SQL**:
```sql
has_role('Admin'::text)
```

#### 4. Admins can delete permissions
- **Type**: DELETE
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Only admins can delete permissions
- **SQL**:
```sql
has_role('Admin'::text)
```

### Available Permissions (Reference)

| Code | Name | Description |
|------|------|-------------|
| `users.delete` | Delete Users | Ability to permanently delete users and their data |
| `users.invite` | Invite Users | Ability to send invitations to new users |
| `users.account` | Manage User Accounts | Ability to update login email, system role, and send password resets |
| `users.permission` | Manage User Permissions | Ability to assign granular permissions to users |
| `users.suspend` | Suspend Users | Ability to suspend and unsuspend users |
| `users.update` | Update User Details | Ability to update personal and employment details of other users |
| `users.view` | View Users | Ability to see the list of users |
| `users.forcelogout` | Force Logout Users | Ability to force logout users from all devices |
| `roles.add` | Add Roles | Ability to create new roles |
| `roles.delete` | Delete Roles | Ability to delete roles |
| `roles.permission` | Manage Role Permissions | Ability to manage permissions assigned to roles |
| `roles.update` | Update Roles | Ability to update role details |
| `roles.view` | View Roles | Ability to see roles |
| `roster.view` | View Roster | Ability to view the employee roster |
| `roster.add` | Add Employee | Ability to add new employees to the roster |
| `roster.update` | Update Employee | Ability to update employee details |
| `roster.delete` | Delete Employee | Ability to remove employees from the roster |

---

## roster_employees Table

**Purpose**: Stores employee details for the roster management system.

### Policies

#### 1. Users with roster.view can view employees
- **Type**: SELECT
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows users with the 'roster.view' permission to view the employee roster.
- **SQL**:
```sql
has_permission('roster.view')
```

#### 2. Users with roster.add can insert employees
- **Type**: INSERT
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows users with the 'roster.add' permission to add new employees.
- **SQL (WITH CHECK)**:
```sql
has_permission('roster.add')
```

#### 3. Users with roster.update can update employees
- **Type**: UPDATE
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows users with the 'roster.update' permission to update employee details.
- **SQL**:
```sql
has_permission('roster.update')
```

#### 4. Users with roster.delete can delete employees
- **Type**: DELETE
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows users with the 'roster.delete' permission to remove employees from the roster.
- **SQL**:
```sql
has_permission('roster.delete')
```

---

## cron.job Table

**Purpose**: Stores scheduled cron jobs for automated tasks.

### Policies

#### 1. cron_job_policy
- **Type**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows access to cron jobs for the current user
- **SQL**:
```sql
(username = CURRENT_USER)
```

---

## cron.job_run_details Table

**Purpose**: Stores execution details and logs for cron job runs.

### Policies

#### 1. cron_job_run_details_policy
- **Type**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows access to cron job run details for the current user
- **SQL**:
```sql
(username = CURRENT_USER)
```

---

## storage.objects Table

**Purpose**: Stores file objects in Supabase Storage (e.g., user avatars, uploaded files).

### Policies

#### 1. Public Access
- **Type**: SELECT
- **Target Roles**: public (authenticated users)
- **Policy Behavior**: Permissive
- **Description**: Allows public read access to files in the 'avatars' bucket
- **SQL**:
```sql
(bucket_id = 'avatars'::text)
```

#### 2. Users can upload their own avatar
- **Type**: INSERT
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows authenticated users to upload files to their own folder in the avatars bucket
- **SQL (WITH CHECK)**:
```sql
((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

#### 3. Users can update their own avatar
- **Type**: UPDATE
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows authenticated users to update their own avatar files
- **SQL**:
```sql
((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

#### 4. Users can delete their own avatar
- **Type**: DELETE
- **Target Roles**: authenticated
- **Policy Behavior**: Permissive
- **Description**: Allows authenticated users to delete their own avatar files
- **SQL**:
```sql
((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

---

## Important Notes

### Policy Behavior: Permissive vs Restrictive
- **Permissive (default)**: If ANY policy allows access, the user gets access (OR logic)
- **Restrictive**: ALL policies must allow access for the user to get access (AND logic)

All policies in this application use **Permissive** behavior, meaning multiple SELECT policies on the same table will work together with OR logic.

### Custom Functions Used
- `has_role(role_name text)`: Checks if the current user has a specific role
- `has_permission(perm_code text)`: Checks if current user has a specific permission (via role or direct)
- `get_my_role_id()`: Returns the role_id of the current user
- `auth.uid()`: Returns the user ID of the currently authenticated user
- `auth.role()`: Returns the role of the current session (e.g., 'authenticated', 'anon')
- `storage.foldername(name)`: Extracts the folder path from a storage object name
- `CURRENT_USER`: PostgreSQL function that returns the current database user
- `update_role_permissions_atomic`: RPC for safe atomic updates of role permissions
- `delete_user_sessions`: RPC for forcing user logout by clearing sessions

---

## Maintenance Guidelines

When adding new policies:
1. Document the policy in this file
2. Include the policy name, type, target roles, and SQL
3. Explain the purpose and any special considerations
4. Update the "Last Updated" date below

**Last Updated**: 2024-01-XX

## Change Log

### 2024-01-XX - Chat Feature Fix
- ✅ Added "Basic profile info viewable for chat" policy to `user_profiles` table
- This enables non-admin users to see the list of users in the chat widget
- Existing profile page security remains intact

### 2024-01-XX - Roster Feature
- ✅ Added `roster_employees` table with full RLS support
- ✅ Created `roster.view`, `roster.add`, `roster.update`, and `roster.delete` permissions