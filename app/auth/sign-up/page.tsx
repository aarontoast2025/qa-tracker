import { redirect } from "next/navigation";

export default function Page() {
  // Disable public signup and redirect to login
  redirect("/auth/login?message=Signups are currently by invitation only.");
}