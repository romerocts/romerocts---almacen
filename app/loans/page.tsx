"use client"

import { AuthProvider } from "@/lib/auth"
import { LoansContent } from "@/components/loans-content"
import { Toaster } from "sonner"

export default function LoansPage() {
  return (
    <AuthProvider>
      <LoansContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
