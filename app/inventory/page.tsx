"use client"

import { AuthProvider } from "@/lib/auth"
import { InventoryContent } from "@/components/inventory-content"
import { Toaster } from "sonner"

export default function InventoryPage() {
  return (
    <AuthProvider>
      <InventoryContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
