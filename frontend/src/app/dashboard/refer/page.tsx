"use client";

import { Share2 } from "lucide-react";

export default function ReferPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32">
      <div className="inline-flex items-center justify-center bg-primary-light p-5 rounded-full mb-5">
        <Share2 className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-2">Refer</h1>
      <p className="text-sm text-muted max-w-xs text-center">
        This feature is coming soon. Stay tuned for updates!
      </p>
    </div>
  );
}
