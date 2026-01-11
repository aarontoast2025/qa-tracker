# QA Tracker: UI/UX & System Polish Plan

This document outlines recommended improvements for the existing modules (**Profile**, **User Management**, and **Roles & Permissions**) to elevate the application's professional quality and performance while maintaining zero or low impact on the 500MB Supabase database limit.

---

## 1. Global Performance & "Snappiness"
### **Skeleton Screen Loaders**
*   **Feature:** Implement `loading.tsx` for all authenticated routes.
*   **Why:** Instead of a "frozen" screen during data fetching, users see a pulsing layout (Skeletons) that matches the content.
*   **Impact:** Zero Database Storage. Makes the app feel "instant."

---

## 2. User Management Enhancements
### **Server-Side Search & Pagination**
*   **Feature:** Move the user filtering from the browser to the Supabase query. Only fetch ~20 users at a time.
*   **Why:** Essential for scaling. Prevents the browser from slowing down when the team grows to hundreds of users.
*   **Impact:** Reduces database load.

### **Bulk Actions**
*   **Feature:** Add checkboxes to the user table rows.
*   **Why:** Allows Admins to select multiple users and perform actions (e.g., "Suspend Selected", "Delete Selected") in one click.
*   **Impact:** UX efficiency.

---

## 3. Roles & Permissions Enhancements
### **Role Member Drill-down**
*   **Feature:** Make the "User Count" in the roles table clickable.
*   **Why:** Admins can instantly see exactly *who* is assigned to a specific role without having to search the full User Management table.
*   **Impact:** Uses existing data; just needs a new UI modal.

---

## 4. Profile & Security Polish
### **Active Session Management**
*   **Feature:** List all active login sessions (Device, Browser, Location) in the Security tab.
*   **Why:** Standard high-end security feature. Allows users to "Logout of all other devices" if they suspect their account is compromised.
*   **Impact:** Zero Storage (Powered by Supabase Auth API).

---

## 5. Advanced Real-time Collaboration (Zero Storage)
### **Editing Collision Detection**
*   **Feature:** Extend the `PresenceHeader` logic.
*   **How:** If User A opens the "Edit" modal for a specific user, User B sees a "User A is currently editing..." warning.
*   **Why:** Prevents "last-write-wins" bugs where two admins overwrite each other's changes.
*   **Impact:** Zero Storage (Uses Realtime Broadcast).

---

## 6. Branding & System Integrity
### **Custom Error Boundaries**
*   **Feature:** Branded `not-found.tsx` (404) and `error.tsx` pages.
*   **Why:** Since we have a strict permissions system, users will inevitably hit "Access Denied" or "Resource Not Found" scenarios. Branded pages maintain a professional feel even during errors.
*   **Impact:** Improves trust and branding.

### **PWA (Progressive Web App)**
*   **Feature:** Add a manifest and service worker.
*   **Why:** Users can "Install" the QA Tracker as a desktop app. It feels like a native tool rather than just another browser tab.
*   **Impact:** Increases user engagement.
