"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DemoSessionValue = {
  email: string | null;
  signIn: (email: string) => void;
  signOut: () => void;
};

const DemoSessionContext = createContext<DemoSessionValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  const signIn = (nextEmail: string) => {
    const trimmedEmail = nextEmail.trim();
    setEmail(trimmedEmail || null);
  };

  const signOut = () => {
    setEmail(null);
  };

  return (
    <DemoSessionContext.Provider value={{ email, signIn, signOut }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error("useDemoSession must be used within DemoSessionProvider");
  }

  return context;
}
