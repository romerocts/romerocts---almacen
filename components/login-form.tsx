"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { PasswordResetForm } from "@/components/password-reset-form"
import { EmailService } from "@/lib/email-service"
import { Wrench, Key } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(email, password)

    if (!success) {
      setError("Credenciales inválidas. Por favor usa el correo y contraseña correctos")
    }

    setIsLoading(false)
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <PasswordResetForm onBack={() => setShowPasswordReset(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Ferretería Araque</CardTitle>
          <CardDescription>Inicia sesión para acceder al sistema de gestión</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ferreteria@araque.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setShowPasswordReset(true)}
            >
              <Key className="h-4 w-4 mr-1" />
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Credenciales de Demostración:</p>
              <p>Correo: ferreteria@araque.com</p>
              <p>Contraseña: admin</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <p className="font-medium">🔐 Restablecimiento de Contraseña:</p>
              <p>Email autorizado: {EmailService.getAuthorizedEmail()}</p>
              <p>Se enviará código real por EmailJS</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
