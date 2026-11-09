import type { UserRow } from "@/lib/session";

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  planStatus: string;
  isAdmin: boolean;
  totpConfirmed: boolean;
}

export function publicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    plan: user.plan,
    planStatus: user.plan_status,
    isAdmin: user.is_admin === 1,
    totpConfirmed: user.totp_confirmed === 1,
  };
}
