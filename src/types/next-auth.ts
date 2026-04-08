import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
    username?: string;
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
      plan: string;
      username: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    plan?: string;
    username?: string;
  }
}
