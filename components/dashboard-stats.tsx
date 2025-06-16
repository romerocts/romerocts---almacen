"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Package, HandHeart, TrendingUp, Users, AlertTriangle } from "lucide-react"

interface Stats {
  totalTools: number
  totalLoaned: number
  activeLoans: number
  totalUsers: number
  lowStockItems: number
  overdueLoans: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalTools: 0,
    totalLoaned: 0,
    activeLoans: 0,
    totalUsers: 0,
    lowStockItems: 0,
    overdueLoans: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Usar la vista de estadísticas de préstamos
      const { data: loanStats } = await supabase.from("loan_statistics").select("*").single()

      // Obtener estadísticas de inventario usando la vista
      const { data: inventoryStats } = await supabase.from("inventory_status").select("*")

      // Calcular estadísticas
      const totalTools = inventoryStats?.reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0
      const totalLoaned = inventoryStats?.reduce((sum, item) => sum + (item.quantity_on_loan || 0), 0) || 0
      const lowStockItems = inventoryStats?.filter((item) => item.stock_status === "low_stock").length || 0

      // Obtener préstamos vencidos
      const { count: overdueCount } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .lt("expected_return_date", new Date().toISOString().split("T")[0])

      setStats({
        totalTools,
        totalLoaned,
        activeLoans: loanStats?.active_loans || 0,
        totalUsers: loanStats?.unique_users || 0,
        lowStockItems,
        overdueLoans: overdueCount || 0,
      })
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total de Herramientas",
      value: stats.totalTools,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Herramientas Prestadas",
      value: stats.totalLoaned,
      icon: HandHeart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Préstamos Activos",
      value: stats.activeLoans,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  // Agregar alertas si hay problemas
  if (stats.lowStockItems > 0) {
    statCards.push({
      title: "Stock Bajo",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    })
  }

  if (stats.overdueLoans > 0) {
    statCards.push({
      title: "Préstamos Vencidos",
      value: stats.overdueLoans,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.bgColor} border-l-4 border-l-current`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
