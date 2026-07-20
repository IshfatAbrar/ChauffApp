"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ImgniIdentify() {
  const { data: session } = useSession();

  useEffect(() => {
    window.IMGNI_CONFIG = window.IMGNI_CONFIG || {};

    if (session?.user?.id) {
      window.IMGNI_CONFIG.user = {
        id: session.user.id,
        email: session.user.email || undefined,
        name: session.user.name || undefined,
      };
    } else {
      delete window.IMGNI_CONFIG.user;
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  return null;
}
