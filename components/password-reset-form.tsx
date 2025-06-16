"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordResetService } from "@/lib/password-reset"
import { EmailService } from "@/lib/email-service"
import { ArrowLeft, Mail, Key, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface PasswordResetFormProps {
  onBack: () => void
}

type Step = "email" | "code" | "password" | "success"

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState(EmailService.getAuthorizedEmail())
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)

  // Timer para reenvío de código
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setCanResend(true)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeLeft])

  const startResendTimer = () => {
    setTimeLeft(60) // 60 segundos antes de poder reenviar
    setCanResend(false)
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    const result = await PasswordResetService.requestPasswordReset(email)

    if (result.success) {
      setMessage(result.message)
      setStep("code")
      startResendTimer()
    } else {
      setError(result.message)
    }

    setIsLoading(false)
  }

  const handleResendCode = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError("")
    setMessage("")

    const result = await PasswordResetService.requestPasswordReset(email)

    if (result.success) {
      setMessage("Nuevo código enviado a tu correo electrónico")
      startResendTimer()
    } else {
      setError(result.message)
    }

    setIsLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos")
      setIsLoading(false)
      return
    }

    const result = await PasswordResetService.verifyResetCode(email, code)

    if (result.success) {
      setMessage(result.message)
      setCodeVerified(true)
      setStep("password")
    } else {
      setError(result.message)
    }

    setIsLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!codeVerified) {
      setError("Debes verificar el código antes de cambiar la contraseña.")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres")
      setIsLoading(false)
      return
    }

    // Llamar realmente a la función de cambio de contraseña
    const result = await PasswordResetService.resetPassword(email, code, newPassword)

    if (result.success) {
      setMessage(result.message)
      setStep("success")
    } else {
      setError(result.message)
    }
    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderStepContent = () => {
    switch (step) {
      case "email":
        return (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico Autorizado</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={EmailService.getAuthorizedEmail()}
                required
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Solo este correo autorizado puede restablecer la contraseña del sistema
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Código de Verificación
                </>
              )}
            </Button>
          </form>
        )

      case "code":
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificación</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-sm text-gray-500">Ingresa el código de 6 dígitos enviado a tu correo electrónico</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Verificar Código
                </>
              )}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendCode}
                disabled={isLoading || !canResend}
                className="flex-1"
              >
                {!canResend ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Reenviar en {formatTime(timeLeft)}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar Código
                  </>
                )}
              </Button>
            </div>
          </form>
        )

      case "password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
                placeholder="Repite la contraseña"
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 4}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Restablecer Contraseña
                </>
              )}
            </Button>
          </form>
        )

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">¡Contraseña Restablecida!</h3>
              <p className="text-gray-600">
                Tu contraseña ha sido restablecida correctamente.
                <br />
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <Button onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio de Sesión
            </Button>
          </div>
        )
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Restablecer Contraseña"
      case "code":
        return "Verificar Código"
      case "password":
        return "Nueva Contraseña"
      case "success":
        return "¡Completado!"
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Te enviaremos un código de verificación por correo electrónico"
      case "code":
        return "Revisa tu correo e ingresa el código de 6 dígitos"
      case "password":
        return "Ingresa tu nueva contraseña segura"
      case "success":
        return "El proceso se ha completado exitosamente"
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case "email":
        return <Mail className="h-8 w-8 text-blue-600" />
      case "code":
        return <Key className="h-8 w-8 text-orange-600" />
      case "password":
        return <Key className="h-8 w-8 text-green-600" />
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600" />
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">{getStepIcon()}</div>
        </div>
        <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}

        {step !== "success" && (
          <Button type="button" variant="ghost" className="w-full mt-4" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inicio de Sesión
          </Button>
        )}

        {step === "email" && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium">📧 Información del Email:</p>
            <p>Se enviará un código de 6 dígitos al correo autorizado</p>
            <p>El código expirará en 15 minutos</p>
            <p>Revisa también tu carpeta de spam</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
