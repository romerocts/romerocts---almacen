"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { FileText, Calendar, User, Package, Search, Download, Phone, Mail } from "lucide-react"

interface LoanRecord {
  id: number
  user_name: string
  user_id_type: string
  user_id_number: string
  user_phone: string | null
  user_email: string | null
  loan_date: string
  expected_return_date: string | null
  actual_return_date: string | null
  status: string
  notes: string | null
  loan_items: {
    id: number
    quantity_loaned: number
    quantity_returned: number
    condition_loaned: string | null
    condition_returned: string | null
    tools: {
      name: string
    }
  }[]
}

export function RecordsManager() {
  const [loans, setLoans] = useState<LoanRecord[]>([])
  const [filteredLoans, setFilteredLoans] = useState<LoanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchUserId, setSearchUserId] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [sortBy, setSortBy] = useState("loan_date")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchLoans()
  }, [])

  useEffect(() => {
    filterAndSortLoans()
  }, [loans, searchUserId, statusFilter, dateFilter, sortBy, sortOrder])

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          loan_items (
            id,
            quantity_loaned,
            quantity_returned,
            condition_loaned,
            condition_returned,
            tools (
              name
            )
          )
        `)
        .order("loan_date", { ascending: false })

      if (error) throw error

      setLoans(data || [])
    } catch (error) {
      console.error("Error obteniendo préstamos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortLoans = () => {
    let filtered = loans

    // Filtrar por ID de usuario o nombre
    if (searchUserId) {
      filtered = filtered.filter(
        (loan) =>
          loan.user_id_number.toLowerCase().includes(searchUserId.toLowerCase()) ||
          loan.user_name.toLowerCase().includes(searchUserId.toLowerCase()),
      )
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter) {
      filtered = filtered.filter((loan) => loan.loan_date.startsWith(dateFilter))
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "user_name":
          aValue = a.user_name.toLowerCase()
          bValue = b.user_name.toLowerCase()
          break
        case "loan_date":
          aValue = new Date(a.loan_date)
          bValue = new Date(b.loan_date)
          break
        case "expected_return_date":
          aValue = a.expected_return_date ? new Date(a.expected_return_date) : new Date(0)
          bValue = b.expected_return_date ? new Date(b.expected_return_date) : new Date(0)
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a.loan_date
          bValue = b.loan_date
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredLoans(filtered)
  }

  const getTotalToolsLoaned = (loan: LoanRecord) => {
    return loan.loan_items.reduce((sum, item) => sum + item.quantity_loaned, 0)
  }

  const getTotalToolsReturned = (loan: LoanRecord) => {
    return loan.loan_items.reduce((sum, item) => sum + item.quantity_returned, 0)
  }

  const getStatusBadge = (loan: LoanRecord) => {
    const isOverdue =
      loan.status === "active" && loan.expected_return_date && new Date(loan.expected_return_date) < new Date()

    if (isOverdue) {
      return <Badge variant="destructive">Vencido</Badge>
    }

    switch (loan.status) {
      case "active":
        return <Badge variant="default">Activo</Badge>
      case "completed":
        return <Badge variant="secondary">Completado</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">{loan.status}</Badge>
    }
  }

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Usuario",
      "Tipo ID",
      "Número ID",
      "Teléfono",
      "Email",
      "Fecha Préstamo",
      "Fecha Esperada",
      "Fecha Real",
      "Estado",
      "Herramientas Prestadas",
      "Herramientas Devueltas",
      "Notas",
    ]

    const csvData = filteredLoans.map((loan) => [
      loan.id,
      loan.user_name,
      loan.user_id_type,
      loan.user_id_number,
      loan.user_phone || "",
      loan.user_email || "",
      new Date(loan.loan_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
      loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "",
      loan.actual_return_date ? new Date(loan.actual_return_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "",
      loan.status,
      getTotalToolsLoaned(loan),
      getTotalToolsReturned(loan),
      loan.notes || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `prestamos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registros de Préstamos</h1>
          <p className="text-gray-600">Ver y buscar historial de préstamos</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros y Ordenamiento */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="searchUser">Buscar Usuario</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="searchUser"
              placeholder="ID o nombre..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="statusFilter">Estado</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dateFilter">Fecha</Label>
          <Input id="dateFilter" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sortBy">Ordenar por</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loan_date">Fecha Préstamo</SelectItem>
              <SelectItem value="user_name">Nombre Usuario</SelectItem>
              <SelectItem value="expected_return_date">Fecha Esperada</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sortOrder">Orden</Label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descendente</SelectItem>
              <SelectItem value="asc">Ascendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Préstamos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLoans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLoans.filter((loan) => loan.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Completados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLoans.filter((loan) => loan.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filteredLoans.map((loan) => loan.user_id_number)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Registros de Préstamos */}
      <div className="space-y-4">
        {filteredLoans.map((loan) => (
          <Card key={loan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{loan.user_name}</CardTitle>
                {getStatusBadge(loan)}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-4">
                  <span>
                    {loan.user_id_type}: {loan.user_id_number}
                  </span>
                  {loan.user_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {loan.user_phone}
                    </span>
                  )}
                  {loan.user_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {loan.user_email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span>📅 Préstamo: {new Date(loan.loan_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  {loan.expected_return_date && (
                    <span>🔄 Esperado: {new Date(loan.expected_return_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  )}
                  {loan.actual_return_date && (
                    <span>✅ Devuelto: {new Date(loan.actual_return_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Prestadas: {getTotalToolsLoaned(loan)}</span>
                  <span>Total Devueltas: {getTotalToolsReturned(loan)}</span>
                </div>

                <div>
                  <Label className="text-sm font-medium">Herramientas:</Label>
                  <div className="mt-2 space-y-2">
                    {loan.loan_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{item.tools.name}</div>
                          <div className="text-sm text-gray-500">
                            Prestadas: {item.quantity_loaned} | Devueltas: {item.quantity_returned}
                            {item.condition_loaned && ` | Estado inicial: ${item.condition_loaned}`}
                            {item.condition_returned && ` | Estado devuelto: ${item.condition_returned}`}
                          </div>
                        </div>
                        {item.quantity_loaned !== item.quantity_returned && (
                          <Badge variant="outline" className="text-orange-600">
                            {item.quantity_loaned - item.quantity_returned} pendientes
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {loan.notes && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <strong>Notas:</strong> {loan.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLoans.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros de préstamos</h3>
          <p className="text-gray-500">
            {searchUserId || statusFilter !== "all" || dateFilter
              ? "Intenta ajustar tus filtros para ver más resultados."
              : "Aún no se han creado préstamos."}
          </p>
        </div>
      )}
    </div>
  )
}
