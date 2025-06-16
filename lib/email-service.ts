import emailjs from "@emailjs/browser"

interface EmailData {
  to: string
  subject: string
  message: string
  code?: string
}

export class EmailService {
  private static readonly AUTHORIZED_EMAIL = "romeropallaresmanueldavid11@gmail.com"
  private static readonly SERVICE_ID = "service_v5meynq"
  private static readonly PUBLIC_KEY = "4JBj5wgeLpDjG4_bu"
  private static readonly TEMPLATE_ID = "template_password_reset"

  static async initializeEmailJS() {
    try {
      emailjs.init(this.PUBLIC_KEY)
      console.log("EmailJS inicializado correctamente")
    } catch (error) {
      console.error("Error inicializando EmailJS:", error)
    }
  }

  static async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    // Verificar que el email sea el autorizado
    if (email !== this.AUTHORIZED_EMAIL) {
      throw new Error("Email no autorizado para restablecimiento de contraseña")
    }

    try {
      // Inicializar EmailJS si no está inicializado
      await this.initializeEmailJS()

      const templateParams = {
        to_email: email,
        to_name: "Administrador", // o el nombre que desees mostrar
        from_name: "Sistema Ferretería Araque",
        subject: "Código de Restablecimiento de Contraseña",
        reset_code: code,
        message: `Has solicitado restablecer tu contraseña para el Sistema de Gestión de Ferretería Araque.\n\nTu código de verificación es: ${code}`,
        expiry_time: "15 minutos",
      }

      console.log("📧 Enviando email a:", email)
      console.log("🔐 Código:", code)

      // Enviar email usando EmailJS
      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams,
        this.PUBLIC_KEY,
      )

      console.log("✅ Email enviado exitosamente:", response)
      return true
    } catch (error) {
      console.error("❌ Error enviando email:", error)
      // Si falla EmailJS, mostrar el código en consola como fallback
      console.log("🔄 Fallback - Código de verificación:", code)
      console.log("📧 Email destino:", email)
      return false
    }
  }

  static generateResetCode(): string {
    // Generar código de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static isAuthorizedEmail(email: string): boolean {
    return email === this.AUTHORIZED_EMAIL
  }

  static getAuthorizedEmail(): string {
    return this.AUTHORIZED_EMAIL
  }
}
