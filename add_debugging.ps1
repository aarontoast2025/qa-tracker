# Read the file content
$filePath = "C:\Projects\qa-tracker\app\(authenticated)\user-management\actions.ts"
$content = Get-Content $filePath -Raw

# Define the old code block (current fixed version)
$oldCode = @'
    const supabase = createAdminClient();

    // IMPORTANT: Delete from user_profiles FIRST to trigger CASCADE deletions
    // This will delete related records: user_chats, user_direct_permissions, etc.
    // The service_role key bypasses RLS and the protect_admin_profiles trigger
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    // Then delete from Auth (this removes login ability)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Profile is already deleted, but auth failed - this is still somewhat successful
      return { error: `User profile deleted but auth deletion failed: ${authError.message}` };
    }

    revalidatePath("/user-management");
    return { success: true };
'@

# Define the new code block with debugging
$newCode = @'
    const supabase = createAdminClient();

    // First, verify the user exists in user_profiles
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.error("Error checking user profile:", checkError);
      return { error: `User profile not found: ${checkError.message}` };
    }

    console.log("Found user profile to delete:", existingProfile);

    // IMPORTANT: Delete from user_profiles FIRST to trigger CASCADE deletions
    // This will delete related records: user_chats, user_direct_permissions, etc.
    // The service_role key bypasses RLS and the protect_admin_profiles trigger
    const { data: deleteData, error: profileError, count } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId)
      .select();

    console.log("Delete result:", { deleteData, profileError, count });

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: `Failed to delete user profile: ${profileError.message}` };
    }

    // Verify deletion
    const { data: verifyProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (verifyProfile) {
      console.error("PROFILE STILL EXISTS AFTER DELETE!", verifyProfile);
      return { error: "Profile deletion failed - record still exists in database" };
    }

    console.log("Profile successfully deleted, now deleting from auth...");

    // Then delete from Auth (this removes login ability)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Profile is already deleted, but auth failed - this is still somewhat successful
      return { error: `User profile deleted but auth deletion failed: ${authError.message}` };
    }

    revalidatePath("/user-management");
    return { success: true };
'@

# Replace the content
$newContent = $content.Replace($oldCode, $newCode)

if ($content -eq $newContent) {
    Write-Host "ERROR: No replacement was made. The old code block was not found in the file."
    Write-Host "This might mean the file content is different than expected."
} else {
    # Write back to file
    Set-Content -Path $filePath -Value $newContent -NoNewline
    Write-Host "File updated successfully with debugging!"
}
