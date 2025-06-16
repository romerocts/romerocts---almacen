import { supabase } from "@/lib/supabase"
import { EmailService } from "@/lib/email-service"

export class PasswordResetService {
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar que el email sea autorizado
      if (!EmailService.isAuthorizedEmail(email)) {
        return {
          success: false,
          message: `Email no autorizado. Solo se permite restablecer la contraseña para ${EmailService.getAuthorizedEmail()}`,
        }
      }

      // Generar código de 6 dígitos
      const code = EmailService.generateResetCode()

      // Calcular tiempo de expiración (15 minutos)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 15)

      // Limpiar códigos anteriores para este email
      await supabase.from("password_reset_codes").delete().eq("email", email)

      // Guardar el nuevo código en la base de datos
      const { error: dbError } = await supabase.from("password_reset_codes").insert([
        {
          email,
          code,
          expires_at: expiresAt.toISOString(),
        },
      ])

      if (dbError) throw dbError

      // Enviar email con el código
      const emailSent = await EmailService.sendPasswordResetCode(email, code)

      if (!emailSent) {
        return {
          success: false,
          message:
            "Error al enviar el código por correo electrónico. El código se ha mostrado en la consola como respaldo.",
        }
      }

      return {
        success: true,
        message: "Código de restablecimiento enviado a tu correo electrónico. Revisa tu bandeja de entrada y spam.",
      }
    } catch (error: any) {
      console.error("Error en requestPasswordReset:", error)
      return {
        success: false,
        message: error?.message || JSON.stringify(error) || "Error interno del servidor",
      }
    }
  }

  static async verifyResetCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar el código en la base de datos solo por email y code
      const { data: resetDataArr, error } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)

      console.log("[DEBUG] Respuesta de Supabase:", resetDataArr)
      if (error) {
        console.error("[DEBUG] Error de Supabase:", error)
      }

      if (!resetDataArr || resetDataArr.length === 0) {
        console.warn("[DEBUG] No se encontró ningún registro con ese email y código.")
        return {
          success: false,
          message: "Código inválido o expirado. Solicita un nuevo código si es necesario.",
        }
      }

      // Filtrar en el frontend por used === false y expires_at > ahora
      const now = new Date()
      const resetData = resetDataArr.find((item) => {
        const used = item.used === false
        const notExpired = new Date(item.expires_at) > now
        console.log(`[DEBUG] Registro: id=${item.id}, used=${item.used}, expires_at=${item.expires_at}, now=${now.toISOString()}, notExpired=${notExpired}`)
        return used && notExpired
      })

      if (!resetData) {
        console.warn("[DEBUG] Ningún registro cumple con used === false y expires_at > ahora.")
        return {
          success: false,
          message: "Código inválido o expirado. Solicita un nuevo código si es necesario.",
        }
      }

      // Marcar el código como usado
      await supabase.from("password_reset_codes").update({ used: true }).eq("id", resetData.id)

      return {
        success: true,
        message: "Código verificado correctamente",
      }
    } catch (error) {
      console.error("Error en verifyResetCode:", error)
      return {
        success: false,
        message: "Error interno del servidor",
      }
    }
  }

  static async resetPassword(
    email: string,
    code: string, // ya no se valida aquí
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Ya no se valida el código aquí, solo se actualiza la contraseña
      if (newPassword.length < 4) {
        return {
          success: false,
          message: "La contraseña debe tener al menos 4 caracteres",
        }
      }

      // Log para depuración antes de actualizar la contraseña
      console.log(`[DEBUG] Intentando actualizar contraseña para email: '${email}' con nueva contraseña: '${newPassword}'`)
      // Actualizar la contraseña en la tabla admin_user
      const { error: updateError, data: updateData } = await supabase
        .from("admin_user")
        .update({ password: newPassword })
        .eq("email", email)
        .select()

      if (updateError) {
        console.error("[DEBUG] Error actualizando contraseña en admin_user:", updateError)
        return {
          success: false,
          message: "No se pudo actualizar la contraseña. Intenta de nuevo.",
        }
      }
      if (!updateData || updateData.length === 0) {
        console.warn("[DEBUG] No se actualizó ningún registro en admin_user para el email:", email)
        return {
          success: false,
          message: "No se encontró el usuario para actualizar la contraseña.",
        }
      }

      return {
        success: true,
        message: "Contraseña restablecida correctamente.",
      }
    } catch (error) {
      console.error("Error en resetPassword:", error)
      return {
        success: false,
        message: "Error interno del servidor",
      }
    }
  }
}
