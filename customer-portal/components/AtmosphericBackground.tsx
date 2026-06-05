"use client";

export default function AtmosphericBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden mesh-bg"
    >
      {/* Drifting orbs */}
      <div className="absolute top-[5%] left-[10%] w-[34rem] h-[34rem] rounded-full bg-red-500/10 dark:bg-red-500/20 blur-3xl animate-drift-1" />
      <div className="absolute top-[40%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-red-700/10 dark:bg-red-700/[0.18] blur-3xl animate-drift-2" />
      <div className="absolute bottom-[10%] left-[35%] w-[36rem] h-[36rem] rounded-full bg-red-400/[0.08] dark:bg-red-400/[0.14] blur-3xl animate-drift-3" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.06)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
}
