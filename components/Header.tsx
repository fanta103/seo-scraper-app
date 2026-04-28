"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { BarChart3, LogIn, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPricingPage, setIsPricingPage] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsPricingPage(pathname.startsWith("/pricing"));
  }, [pathname]);

  const premiumSpring = { type: "spring", stiffness: 260, damping: 20 };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 w-full border-b bg-background/60 backdrop-blur-xl z-50 transition-colors duration-500 ${isPricingPage ? "border-transparent" : "border-border"
        }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* --- DYNAMIC LOGO SECTION --- */}
        <div className="flex items-center">
          <Link href="/" className="group flex items-center gap-3">
            <motion.div
              className="relative flex size-9 items-center justify-center rounded-xl bg-foreground text-background font-black shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="z-10 text-lg">S</span>
              {/* Animated "Liquid" background behind the B */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-100"
                animate={{
                  borderRadius: ["20% 80% 70% 30% / 30% 30% 70% 70%", "80% 20% 30% 70% / 70% 30% 70% 30%", "20% 80% 70% 30% / 30% 30% 70% 70%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 rounded-xl ring-2 ring-foreground/20 group-hover:ring-primary/50 transition-all" />
            </motion.div>

            <div className="flex flex-col">
              <motion.div className="flex overflow-hidden">
                {"Serpify".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 0 }}
                    whileHover={{ y: -20 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-sm font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                className="h-0.5 bg-primary/40 rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
              />
            </div>
          </Link>
        </div>

        {/* ACTIONS SECTION */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="relative h-9 px-3 gap-2 overflow-hidden group">
              <BarChart3 className="size-4 group-hover:text-primary transition-colors" />
              <span className="hidden md:inline-block">Dashboard</span>
              <motion.div
                className="absolute inset-0 bg-primary/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
              />
            </Button>
          </Link>

          {/* THEME TOGGLE (Celestial Style) */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative size-9 flex items-center justify-center rounded-lg border border-foreground/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mounted && (
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={premiumSpring}
                >
                  {theme === "dark" ? (
                    <Moon className="size-4 text-blue-400 fill-blue-400/20" />
                  ) : (
                    <Sun className="size-4 text-orange-500 fill-orange-500/20" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* AUTH STATES */}
          <div className="flex items-center min-w-[40px]">
            <AnimatePresence mode="wait">
              <AuthLoading key="loading">
                <div className="size-5 rounded-full border-2 border-t-foreground animate-spin opacity-20" />
              </AuthLoading>
              <Unauthenticated key="unauth">
                <SignInButton mode="modal">
                  <Button size="sm" className="h-9 font-semibold shadow-sm">
                    Sign in
                  </Button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated key="auth">
                <UserButton afterSignOutUrl="/" />
              </Authenticated>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;