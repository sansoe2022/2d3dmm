import React, { createContext, useContext, useState, useEffect } from "react";

export type SessionType = "morning" | "evening";

interface SessionContextType {
  date: Date;
  session: SessionType;
  setDate: (date: Date) => void;
  setSession: (session: SessionType) => void;
  sessionKey: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<Date>(() => new Date());
  const [session, setSession] = useState<SessionType>(() => {
    // Auto-detect session based on current time
    const hour = new Date().getHours();
    return hour < 12 ? "morning" : "evening";
  });

  // Generate session key based on date and session
  const sessionKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${session}`;

  const value: SessionContextType = {
    date,
    session,
    setDate,
    setSession,
    sessionKey,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
