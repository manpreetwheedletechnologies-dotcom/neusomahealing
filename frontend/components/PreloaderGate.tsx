"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const Preloader = dynamic(
  () => import("./Preloader").then((mod) => mod.Preloader),
  { ssr: false }
);

const STORAGE_KEY = "neusoma_preloader_shown";

/*
 * Defaults to `true` so anything rendered outside the provider
 * (or during SSR, before the check below can run) reveals
 * immediately instead of staying hidden forever.
 */
const PreloaderDoneContext = createContext(true);

export function usePreloaderDone() {
  return useContext(PreloaderDoneContext);
}

export function PreloaderGate({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [isDone, setIsDone] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return; // StrictMode ke double-run ko block karo
    hasChecked.current = true;

    try {
      const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
      if (alreadyShown) {
        setShouldShow(false);
      } else {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setShouldShow(true);
      }
    } catch {
      setShouldShow(true);
    }
  }, []);

  useEffect(() => {
    // Nothing to show this session (or the check hasn't resolved
    // yet) — treat page content as immediately revealed.
    if (shouldShow !== true) {
      setIsDone(true);
    }
  }, [shouldShow]);

  return (
    <PreloaderDoneContext.Provider value={isDone}>
      {shouldShow ? <Preloader onDone={() => setIsDone(true)} /> : null}
      {children}
    </PreloaderDoneContext.Provider>
  );
}
