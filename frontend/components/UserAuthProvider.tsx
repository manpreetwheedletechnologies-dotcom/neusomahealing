"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type SiteUser,
} from "@/lib/user-api";

type UserAuthValue = {
  user: SiteUser | null;

  /*
   * True only during the initial session check.
   * Components should wait for this before deciding
   * a visitor is signed out, otherwise every page
   * flashes the logged-out state on first paint.
   */
  loading: boolean;

  signIn: (input: {
    email: string;
    password: string;
  }) => Promise<void>;

  signUp: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;

  signOut: () => Promise<void>;

  setUser: (user: SiteUser | null) => void;
  refresh: () => Promise<void>;
};

const UserAuthContext =
  createContext<UserAuthValue | null>(null);

export function useUserAuth() {
  const context = useContext(UserAuthContext);

  if (!context) {
    throw new Error(
      "useUserAuth must be used inside <UserAuthProvider>.",
    );
  }

  return context;
}

export function UserAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<SiteUser | null>(null);

  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await getCurrentUser());
    } catch {
      // No valid session — visitor is simply signed out.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((value) => {
        if (active) setUser(value);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (input: {
      email: string;
      password: string;
    }) => {
      setUser(await loginUser(input));
    },
    [],
  );

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      setUser(await registerUser(input));
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Clear locally even if the network call failed,
      // so the UI never looks signed in after a sign-out.
      setUser(null);
    }
  }, []);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        setUser,
        refresh,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}
