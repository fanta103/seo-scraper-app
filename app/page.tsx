"use client"
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle, Globe,
  MessageSquare,
  Search, Shield,
  Sparkles, Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// --- Flagship Animation Variants ---

const springTransition = { type: "spring", stiffness: 100, damping: 20 };

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const fadeInUpVariant = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springTransition, duration: 0.8 }
  }
};

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const shineEffect = {
  initial: { x: "-100%", opacity: 0 },
  hover: {
    x: "100%",
    opacity: 0.4,
    transition: { duration: 0.6, ease: "linear" }
  }
};

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Subtle Parallax for Hero content
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 selection:bg-blue-500/30 overflow-x-hidden">

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Floating Background Shapes */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-purple-500/10 blur-[120px] rounded-full"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]" />

        <motion.div
          style={{ y: yHero, opacity: opacityHero }}
          className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
        >
          <motion.div
            className="text-center"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUpVariant}>
              <Badge className="mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 cursor-default shadow-sm backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1 text-yellow-500 animate-pulse" />
                Powered by Bright Data & OpenAI
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUpVariant} className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                           <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                               Generate Beautiful
                           </span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                               SEO Reports
                          </span>
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                               in Seconds
                          </span>
            </motion.h1>

            <motion.p variants={fadeInUpVariant} className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Harness the power of Bright Data&apos;s SERP Perplexity Scraper to
              create comprehensive SEO reports instantly.
              <span className="text-foreground font-medium block mt-2">
                            Fast, simple, and incredibly insightful.
                          </span>
            </motion.p>

            <motion.div variants={fadeInUpVariant} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Unauthenticated>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <Button size="lg" className="relative overflow-hidden text-base px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 group border-0 hover:scale-105 active:scale-95">
                    <motion.div variants={shineEffect} initial="initial" whileHover="hover" className="absolute inset-0 bg-white skew-x-12" />
                    <Search className="relative w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative">Generate My Report</span>
                    <ArrowRight className="relative w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignInButton>
              </Unauthenticated>

              <Authenticated>
                <Link href="/dashboard">
                  <Button size="lg" className="relative overflow-hidden text-base px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 group border-0 hover:scale-105 active:scale-95">
                    <motion.div variants={shineEffect} initial="initial" whileHover="hover" className="absolute inset-0 bg-white skew-x-12" />
                    <Search className="relative w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="relative">Generate My Report</span>
                    <ArrowRight className="relative w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Authenticated>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={springTransition}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Choose Your SEO Superpower
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you&apos;re just getting started or need advanced insights, we&apos;ve got the perfect plan for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Starter Plan Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              transition={springTransition}
              
            >
              <Card className="relative h-full overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] group bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-950/50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"
                />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md"
                    >
                      <BarChart3 className="w-6 h-6" />
                    </motion.div>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Starter</Badge>
                  </div>
                  <CardTitle className="text-2xl">Full SEO Reports</CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Generate comprehensive SEO reports powered by Bright Data&apos;s advanced SERP technology.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3">
                    {["Complete SERP analysis", "Keyword ranking insights", "Competitor analysis", "Export to PDF/CSV"].map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i, ...springTransition }}
                        className="flex items-center gap-2 text-sm group/item"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 transition-transform group-hover/item:scale-125" />
                        <span className="group-hover/item:translate-x-1 transition-transform">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              transition={springTransition}
            >
              <Card className="relative h-full overflow-hidden border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(168,85,247,0.2)] group bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-orange-50/80 dark:from-purple-950/80 dark:via-pink-950/80 dark:to-orange-950/80">
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-orange-400/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"
                />
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg z-10">
                  <Sparkles className="w-3 h-3 mr-1 text-yellow-300" /> Popular
                </Badge>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      whileHover={{ rotate: -15, scale: 1.1 }}
                      className="p-2 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white shadow-md"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </motion.div>
                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900 dark:to-pink-900 dark:text-purple-300 border-0">Pro</Badge>
                  </div>
                  <CardTitle className="text-2xl">Chat With Your Report</CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                    Everything in Starter, plus the power to have intelligent conversations with your SEO data using GPT.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3">
                    {["All Starter features", "AI-powered chat interface", "Ask questions about your data", "Get actionable recommendations", "Priority support"].map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i, ...springTransition }}
                        className="flex items-center gap-2 text-sm group/item"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 transition-transform group-hover/item:scale-125" />
                        <span className={`group-hover/item:translate-x-1 transition-transform ${i < 2 ? "font-medium" : ""}`}>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-r from-emerald-50/50 via-blue-50/50 to-purple-50/50 dark:from-emerald-950/50 dark:via-blue-950/50 dark:to-purple-950/50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={springTransition}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">Choose the plan that fits your SEO needs. Upgrade or downgrade anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Pricing */}
            <motion.div
              whileHover={{ y: -12, rotateY: 5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springTransition}
              className="perspective-1000"
            >
              <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/50 dark:to-cyan-950/50">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-xl mb-2">Starter</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">$19</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2 text-slate-500">Perfect for small businesses</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="space-y-3 flex-grow">
                    {["Bright Data SERP scraping", "PDF & CSV exports", "Email support"].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/pricing" className="mt-auto pt-6">
                    <Button className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md group" size="lg">
                      <motion.div variants={shineEffect} initial="initial" whileHover="hover" className="absolute inset-0 bg-white skew-x-12" />
                      <span className="relative">Subscribe to Starter</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Pricing */}
            <motion.div
              whileHover={{ y: -12, rotateY: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springTransition}
              className="perspective-1000"
            >
              <Card className="border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 relative bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-rose-50/80 dark:from-purple-950/80 dark:via-pink-950/80 dark:to-rose-950/80 h-full backdrop-blur-sm">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl px-4 py-1">Most Popular</Badge>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-xl mb-2">Pro</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">$49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2 text-slate-500">For agencies & power users</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="space-y-3 flex-grow">
                    {["Everything in Starter", "AI Chat with reports", "Priority support"].map((item, i) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className={`text-sm ${i === 1 ? 'font-medium' : ''}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/pricing" className="mt-auto pt-6">
                    <Button className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-md group" size="lg">
                      <motion.div variants={shineEffect} initial="initial" whileHover="hover" className="absolute inset-0 bg-white skew-x-12" />
                      <span className="relative">Subscribe to Pro</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-semibold mb-4">Powered by Industry Leaders</h2>
            <p className="text-muted-foreground">Built with enterprise-grade technology and security you can trust</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center transition-all duration-500"
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: <Globe />, label: "Bright Data" },
              { icon: <Zap />, label: "Vercel" },
              { icon: <MessageSquare />, label: "OpenAI" },
              { icon: <Shield />, label: "Clerk" }
            ].map((brand) => (
              <motion.div
                key={brand.label}
                variants={fadeInUpVariant}
                whileHover={{ y: -5, opacity: 1, scale: 1.1 }}
                className="flex items-center justify-center cursor-default group opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-2 text-lg font-semibold grayscale group-hover:grayscale-0 transition-all duration-500">
                  <motion.div variants={floatingAnimation} initial="initial" animate="animate">
                    {brand.icon}
                  </motion.div>
                  {brand.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springTransition}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 shadow-sm backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 text-green-600 animate-pulse" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Enterprise-grade security & 99.9% uptime guaranteed
                          </span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}