import { base } from "$app/paths";
import { redirect } from "@sveltejs/kit";
import { getCurrentUser, getToken } from "$lib/api";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
  const isLogin = url.pathname === `${base}/login` || url.pathname === "/login";

  if (isLogin) {
    return {};
  }

  if (!getToken()) {
    redirect(303, `${base}/login`);
  }

  try {
    const user = await getCurrentUser();
    if (user.role !== "admin") {
      redirect(303, `${base}/login`);
    }
    return { user };
  } catch {
    redirect(303, `${base}/login`);
  }
};
