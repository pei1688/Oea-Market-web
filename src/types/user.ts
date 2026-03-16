import { Session, User } from "better-auth";
import { createAuthClient } from "better-auth/react";

export type AuthClient = ReturnType<typeof createAuthClient>;

export type SessionWithUser = {
  user: User;
  session: Session;
};
