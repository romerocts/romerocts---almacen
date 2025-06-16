"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Plus, HandHeart, Minus, AlertTriangle, Phone, Mail } from "lucide-react"
import { toast } from "sonner"

interface Tool {
  id: number
  name: string
  quantity: number
  tool_types: {
    name: string
  }
}

interface LoanItem {
  tool_id: number
  quantity: number
  tool_name: string
}

interface ActiveLoan {
  id: number
  user_name: string
  user_id_type: string
  user_id_number: string
  user_phone: string | null
  user_email: string | null
  loan_date: string
  expected_return_date: string | null
  status: string
  notes: string | null
  loan_items: {
    id: number
    tool_id: number
    quantity_loaned: number
    quantity_returned: number
    condition_loaned: string | null
    tools: {
      name: string
    }
  }[]
}

export function LoansManager() {
  const [tools, setTools] = useState<Tool[]>([])
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Estados del formulario
  const [loanForm, setLoanForm] = useState({
    user_name: "",
    user_id_type: "DNI",
    user_id_number: "",
    user_phone: "",
    user_email: "",
    expected_return_date: "",
    notes: "",
    loan_items: [] as LoanItem[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Obtener herramientas disponibles usando la vista de inventario
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_status")
        .select("*")
        .gt("available_quantity", 0)

      if (inventoryError) throw inventoryError

      // Convertir datos de la vista al formato esperado
      const toolsData =
        inventoryData?.map((item) => ({
          id: item.id!,
          name: item.name!,
          quantity: item.available_quantity!,
          tool_types: {
            name: item.tool_type!,
          },
        })) || []

      // Obtener préstamos activos
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select(`
          *,
          loan_items (
            id,
            tool_id,
            quantity_loaned,
            quantity_returned,
            condition_loaned,
            tools (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("loan_date", { ascending: false })

      if (loansError) throw loansError

      setTools(toolsData)
      setActiveLoans(loansData || [])
    } catch (error) {
      console.error("Error obteniendo datos:", error)
      toast.error("Error al cargar los datos de préstamos")
    } finally {
      setIsLoading(false)
    }
  }

  const addLoanItem = (toolId: number, toolName: string) => {
    const tool = tools.find((t) => t.id === toolId)
    if (!tool) return

    const existingItem = loanForm.loan_items.find((item) => item.tool_id === toolId)
    if (existingItem) {
      // Verificar que no exceda la cantidad disponible
      if (existingItem.quantity >= tool.quantity) {
        toast.error(`Solo hay ${tool.quantity} unidades disponibles de ${toolName}`)
        return
      }
      setLoanForm({
        ...loanForm,
        loan_items: loanForm.loan_items.map((item) =>
          item.tool_id === toolId ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      })
    } else {
      setLoanForm({
        ...loanForm,
        loan_items: [...loanForm.loan_items, { tool_id: toolId, quantity: 1, tool_name: toolName }],
      })
    }
  }

  const removeLoanItem = (toolId: number) => {
    const existingItem = loanForm.loan_items.find((item) => item.tool_id === toolId)
    if (existingItem && existingItem.quantity > 1) {
      setLoanForm({
        ...loanForm,
        loan_items: loanForm.loan_items.map((item) =>
          item.tool_id === toolId ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      })
    } else {
      setLoanForm({
        ...loanForm,
        loan_items: loanForm.loan_items.filter((item) => item.tool_id !== toolId),
      })
    }
  }

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loanForm.loan_items.length === 0) {
      toast.error("Por favor agrega al menos una herramienta al préstamo")
      return
    }

    if (!loanForm.user_name.trim() || !loanForm.user_id_number.trim()) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    // Validar que hay suficiente stock
    for (const item of loanForm.loan_items) {
      const tool = tools.find((t) => t.id === item.tool_id)
      if (!tool || tool.quantity < item.quantity) {
        toast.error(`No hay suficiente stock de ${item.tool_name}`)
        return
      }
    }

    try {
      // Crear el préstamo
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .insert([
          {
            user_name: loanForm.user_name.trim(),
            user_id_type: loanForm.user_id_type,
            user_id_number: loanForm.user_id_number.trim(),
            user_phone: loanForm.user_phone.trim() || null,
            user_email: loanForm.user_email.trim() || null,
            expected_return_date: loanForm.expected_return_date || null,
            notes: loanForm.notes.trim() || null,
            status: "active",
            loan_date: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (loanError) throw loanError

      // Crear elementos del préstamo
      const loanItems = loanForm.loan_items.map((item) => ({
        loan_id: loanData.id,
        tool_id: item.tool_id,
        quantity_loaned: item.quantity,
        condition_loaned: "good",
      }))

      const { error: itemsError } = await supabase.from("loan_items").insert(loanItems)

      if (itemsError) throw itemsError

      // Actualizar cantidades de herramientas
      for (const item of loanForm.loan_items) {
        const { data: currentTool, error: toolFetchError } = await supabase
          .from("tools")
          .select("quantity")
          .eq("id", item.tool_id)
          .single()

        if (toolFetchError) throw toolFetchError

        const { error: updateError } = await supabase
          .from("tools")
          .update({
            quantity: currentTool.quantity - item.quantity,
          })
          .eq("id", item.tool_id)

        if (updateError) throw updateError
      }

      toast.success("Préstamo creado exitosamente")
      setIsCreateDialogOpen(false)
      setLoanForm({
        user_name: "",
        user_id_type: "DNI",
        user_id_number: "",
        user_phone: "",
        user_email: "",
        expected_return_date: "",
        notes: "",
        loan_items: [],
      })
      fetchData()
    } catch (error) {
      console.error("Error creando préstamo:", error)
      toast.error("Error al crear el préstamo")
    }
  }

  const handleReturnTool = async (loanId: number, loanItemId: number, maxQuantity: number, toolId: number) => {
    const quantityToReturn = prompt(`¿Cuántas herramientas devolver? (Máximo: ${maxQuantity})`)
    if (!quantityToReturn || isNaN(Number(quantityToReturn))) return

    const quantity = Number.parseInt(quantityToReturn)
    if (quantity <= 0 || quantity > maxQuantity) {
      toast.error("Cantidad inválida")
      return
    }

    const condition = "good"

    try {
      // Obtener la cantidad ya devuelta
      const { data: currentLoanItem, error: fetchError } = await supabase
        .from("loan_items")
        .select("quantity_returned")
        .eq("id", loanItemId)
        .single()

      if (fetchError) throw fetchError

      const newReturnedQuantity = currentLoanItem.quantity_returned + quantity

      // Actualizar elemento del préstamo
      const { error: updateError } = await supabase
        .from("loan_items")
        .update({
          quantity_returned: newReturnedQuantity,
          condition_returned: condition,
        })
        .eq("id", loanItemId)

      if (updateError) throw updateError

      // Actualizar cantidad de herramienta en inventario
      const { data: tool, error: toolError } = await supabase.from("tools").select("quantity").eq("id", toolId).single()

      if (toolError) throw toolError

      const { error: toolUpdateError } = await supabase
        .from("tools")
        .update({
          quantity: tool.quantity + quantity,
        })
        .eq("id", toolId)

      if (toolUpdateError) throw toolUpdateError

      // Verificar si todos los elementos han sido devueltos
      const { data: remainingItems } = await supabase
        .from("loan_items")
        .select("quantity_loaned, quantity_returned")
        .eq("loan_id", loanId)

      const allReturned = remainingItems?.every((item) => item.quantity_loaned === item.quantity_returned)

      if (allReturned) {
        await supabase
          .from("loans")
          .update({
            status: "completed",
            actual_return_date: new Date().toISOString(),
          })
          .eq("id", loanId)
      }

      toast.success("Herramientas devueltas exitosamente")
      fetchData()
    } catch (error) {
      console.error("Error devolviendo herramientas:", error)
      toast.error("Error al devolver las herramientas")
    }
  }

  const isOverdue = (expectedReturnDate: string | null) => {
    if (!expectedReturnDate) return false
    return new Date(expectedReturnDate) < new Date()
  }

  const getDefaultReturnDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7) // 7 días por defecto
    return date.toISOString().split("T")[0]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Préstamos de Herramientas</h1>
          <p className="text-gray-600">Gestionar préstamos y devoluciones de herramientas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Préstamo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLoan} className="space-y-6">
              {/* Información del Usuario */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información del Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Nombre Completo *</Label>
                    <Input
                      id="userName"
                      value={loanForm.user_name}
                      onChange={(e) => setLoanForm({ ...loanForm, user_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userIdNumber">Número de Identificación *</Label>
                    <Input
                      id="userIdNumber"
                      value={loanForm.user_id_number}
                      onChange={(e) => setLoanForm({ ...loanForm, user_id_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="idType">Tipo de Identificación</Label>
                    <Select
                      value={loanForm.user_id_type}
                      onValueChange={(value) => setLoanForm({ ...loanForm, user_id_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Licencia">Licencia de Conducir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedReturn">Fecha Esperada de Devolución</Label>
                    <Input
                      id="expectedReturn"
                      type="date"
                      value={loanForm.expected_return_date}
                      onChange={(e) => setLoanForm({ ...loanForm, expected_return_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      placeholder={getDefaultReturnDate()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPhone">Teléfono</Label>
                    <Input
                      id="userPhone"
                      type="tel"
                      value={loanForm.user_phone}
                      onChange={(e) => setLoanForm({ ...loanForm, user_phone: e.target.value })}
                      placeholder="555-0123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={loanForm.user_email}
                      onChange={(e) => setLoanForm({ ...loanForm, user_email: e.target.value })}
                      placeholder="usuario@email.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="loanNotes">Notas del Préstamo</Label>
                  <Textarea
                    id="loanNotes"
                    value={loanForm.notes}
                    onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                    placeholder="Notas adicionales sobre el préstamo"
                  />
                </div>
              </div>

              {/* Selección de Herramientas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Herramientas Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {tools.map((tool) => {
                    const loanItem = loanForm.loan_items.find((item) => item.tool_id === tool.id)
                    const availableQuantity = tool.quantity - (loanItem?.quantity || 0)

                    return (
                      <div key={tool.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-sm text-gray-500">
                            {tool.tool_types.name} • {availableQuantity} disponibles
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addLoanItem(tool.id, tool.name)}
                          disabled={availableQuantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Herramientas Seleccionadas */}
              {loanForm.loan_items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Herramientas Seleccionadas</h3>
                  <div className="space-y-2 border rounded-lg p-4">
                    {loanForm.loan_items.map((item) => (
                      <div key={item.tool_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.tool_name}</div>
                          <div className="text-sm text-gray-500">Cantidad: {item.quantity}</div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeLoanItem(item.tool_id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loanForm.loan_items.length === 0}>
                Crear Préstamo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Préstamos Activos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Préstamos Activos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeLoans.map((loan) => {
            const overdue = isOverdue(loan.expected_return_date)
            return (
              <Card key={loan.id} className={overdue ? "border-red-200 bg-red-50" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{loan.user_name}</span>
                    <div className="flex gap-2">
                      {overdue && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Vencido
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <HandHeart className="h-4 w-4 mr-1" />
                        Activo
                      </Badge>
                    </div>
                  </CardTitle>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      {loan.user_id_type}: {loan.user_id_number}
                    </div>
                    <div className="flex items-center gap-4">
                      <span>📅 {new Date(loan.loan_date).toLocaleDateString("es-ES")}</span>
                      {loan.expected_return_date && (
                        <span className={overdue ? "text-red-600 font-medium" : ""}>
                          🔄 {new Date(loan.expected_return_date).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                    {loan.user_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {loan.user_phone}
                      </div>
                    )}
                    {loan.user_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {loan.user_email}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label>Herramientas Prestadas:</Label>
                    {loan.loan_items.map((item) => {
                      const remainingQuantity = item.quantity_loaned - item.quantity_returned
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{item.tools.name}</div>
                            <div className="text-sm text-gray-500">
                              {remainingQuantity} de {item.quantity_loaned} pendientes
                              {item.condition_loaned && ` • Estado: ${item.condition_loaned}`}
                            </div>
                          </div>
                          {remainingQuantity > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReturnTool(loan.id, item.id, remainingQuantity, item.tool_id)}
                            >
                              Devolver
                            </Button>
                          )}
                        </div>
                      )
                    })}
                    {loan.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Notas:</strong> {loan.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {activeLoans.length === 0 && (
          <div className="text-center py-12">
            <HandHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay préstamos activos</h3>
            <p className="text-gray-500">Crea tu primer préstamo para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
