import LoginForm from "../../components/LoginForm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";

import React from "react";

export default async function page() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "fleet") {
    redirect("/partner/dashboard");
  }

  if (session) {
    redirect("/");
  }

  return (
    <div>
      <LoginForm />
    </div>
  );
}
