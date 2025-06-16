"use client"

import { AuthProvider } from "@/lib/auth"
import { AppContent } from "@/components/app-content"
import { Toaster } from "sonner"

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
