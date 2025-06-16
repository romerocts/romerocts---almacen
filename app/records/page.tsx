"use client"

import { AuthProvider } from "@/lib/auth"
import { RecordsContent } from "@/components/records-content"
import { Toaster } from "sonner"

export default function RecordsPage() {
  return (
    <AuthProvider>
      <RecordsContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
