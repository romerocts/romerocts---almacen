"use client"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"

export function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar formulario de login
  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Si está autenticado, mostrar el dashboard
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 lg:ml-0 ml-0 pt-16 lg:pt-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
              <p className="text-gray-600">Resumen del sistema de gestión de ferretería</p>
            </div>

            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
                <div className="space-y-3">
                  <a href="/inventory" className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="font-medium text-blue-900">Gestionar Inventario</div>
                    <div className="text-sm text-blue-700">Agregar, editar o eliminar herramientas del inventario</div>
                  </a>
                  <a href="/loans" className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="font-medium text-green-900">Crear Nuevo Préstamo</div>
                    <div className="text-sm text-green-700">Prestar herramientas a clientes</div>
                  </a>
                  <a
                    href="/records"
                    className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="font-medium text-purple-900">Ver Registros de Préstamos</div>
                    <div className="text-sm text-purple-700">Seguimiento de préstamos activos y completados</div>
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Estado del Sistema</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Conexión a Base de Datos</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Conectado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Último Respaldo</span>
                    <span className="text-sm text-gray-500">Hoy, 2:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Versión del Sistema</span>
                    <span className="text-sm text-gray-500">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
