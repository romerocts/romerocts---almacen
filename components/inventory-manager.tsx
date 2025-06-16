"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Package, AlertTriangle, Search } from "lucide-react"
import { toast } from "sonner"

interface Tool {
  id: number
  name: string
  tool_type_id: number
  quantity: number
  min_stock: number | null
  location: string | null
  condition: string
  notes: string | null
  tool_types: {
    id: number
    name: string
  }
}

interface ToolType {
  id: number
  name: string
  description: string | null
}

export function InventoryManager() {
  const [tools, setTools] = useState<Tool[]>([])
  const [toolTypes, setToolTypes] = useState<ToolType[]>([])
  const [filteredTools, setFilteredTools] = useState<Tool[]>([])
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false)
  const [isDeleteTypeDialogOpen, setIsDeleteTypeDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [selectedTypeToDelete, setSelectedTypeToDelete] = useState<string>("")

  // Estados del formulario
  const [newTool, setNewTool] = useState({
    name: "",
    tool_type_id: "",
    quantity: "",
    min_stock: "",
    location: "",
    condition: "good",
    notes: "",
  })
  const [newToolType, setNewToolType] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterTools()
  }, [tools, selectedTypeFilter, searchTerm, stockFilter])

  const fetchData = async () => {
    try {
      // Obtener herramientas con sus tipos
      const { data: toolsData, error: toolsError } = await supabase
        .from("tools")
        .select(`
          *,
          tool_types (
            id,
            name
          )
        `)
        .order("name")

      if (toolsError) throw toolsError

      // Obtener tipos de herramientas
      const { data: typesData, error: typesError } = await supabase.from("tool_types").select("*").order("name")

      if (typesError) throw typesError

      setTools(toolsData || [])
      setToolTypes(typesData || [])
    } catch (error) {
      console.error("Error obteniendo datos:", error)
      toast.error("Error al cargar los datos del inventario")
    } finally {
      setIsLoading(false)
    }
  }

  const filterTools = () => {
    let filtered = tools

    // Filtrar por tipo
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter((tool) => tool.tool_type_id.toString() === selectedTypeFilter)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.tool_types.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tool.location && tool.location.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtrar por stock
    if (stockFilter === "low") {
      filtered = filtered.filter((tool) => tool.quantity <= (tool.min_stock || 1))
    } else if (stockFilter === "out") {
      filtered = filtered.filter((tool) => tool.quantity === 0)
    }

    setFilteredTools(filtered)
  }

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTool.name.trim() || !newTool.tool_type_id) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const { error } = await supabase.from("tools").insert([
        {
          name: newTool.name.trim(),
          tool_type_id: Number.parseInt(newTool.tool_type_id),
          quantity: Number.parseInt(newTool.quantity) || 0,
          min_stock: newTool.min_stock ? Number.parseInt(newTool.min_stock) : null,
          location: newTool.location.trim() || null,
          condition: newTool.condition,
          notes: newTool.notes.trim() || null,
        },
      ])

      if (error) throw error

      toast.success("Herramienta agregada exitosamente")
      setIsAddDialogOpen(false)
      setNewTool({
        name: "",
        tool_type_id: "",
        quantity: "",
        min_stock: "",
        location: "",
        condition: "good",
        notes: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error agregando herramienta:", error)
      toast.error("Error al agregar la herramienta")
    }
  }

  const handleEditTool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTool) return

    try {
      const { error } = await supabase
        .from("tools")
        .update({
          name: editingTool.name,
          tool_type_id: editingTool.tool_type_id,
          quantity: editingTool.quantity,
          min_stock: editingTool.min_stock,
          location: editingTool.location,
          condition: editingTool.condition,
          notes: editingTool.notes,
        })
        .eq("id", editingTool.id)

      if (error) throw error

      toast.success("Herramienta actualizada exitosamente")
      setIsEditDialogOpen(false)
      setEditingTool(null)
      fetchData()
    } catch (error) {
      console.error("Error actualizando herramienta:", error)
      toast.error("Error al actualizar la herramienta")
    }
  }

  const handleDeleteTool = async (toolId: number, toolName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${toolName}"?`)) return

    try {
      const { error } = await supabase.from("tools").delete().eq("id", toolId)

      if (error) throw error

      toast.success("Herramienta eliminada exitosamente")
      fetchData()
    } catch (error) {
      console.error("Error eliminando herramienta:", error)
      toast.error("Error al eliminar la herramienta")
    }
  }

  const handleAddToolType = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newToolType.name.trim()) {
      toast.error("El nombre del tipo es obligatorio")
      return
    }

    try {
      const { error } = await supabase.from("tool_types").insert([
        {
          name: newToolType.name.trim(),
          description: newToolType.description.trim() || null,
        },
      ])

      if (error) throw error

      toast.success("Tipo de herramienta agregado exitosamente")
      setIsAddTypeDialogOpen(false)
      setNewToolType({ name: "", description: "" })
      fetchData()
    } catch (error) {
      console.error("Error agregando tipo de herramienta:", error)
      toast.error("Error al agregar el tipo de herramienta")
    }
  }

  // Eliminar tipo de herramienta y todas las herramientas asociadas
  const handleDeleteToolType = async (typeId: number, typeName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el tipo de herramienta "${typeName}" y todas sus herramientas asociadas? Esta acción no se puede deshacer.`)) return
    try {
      // Eliminar herramientas asociadas
      const { error: toolsError } = await supabase.from("tools").delete().eq("tool_type_id", typeId)
      if (toolsError) throw toolsError
      // Eliminar el tipo de herramienta
      const { error } = await supabase.from("tool_types").delete().eq("id", typeId)
      if (error) throw error
      toast.success("Tipo de herramienta y herramientas asociadas eliminados exitosamente")
      fetchData()
    } catch (error) {
      console.error("Error eliminando tipo de herramienta:", error)
      toast.error("Error al eliminar el tipo de herramienta")
    }
  }

  const getStockStatus = (tool: Tool) => {
    if (tool.quantity === 0) return { status: "out", color: "bg-red-100 text-red-800", text: "Sin Stock" }
    if (tool.quantity <= (tool.min_stock || 1))
      return { status: "low", color: "bg-yellow-100 text-yellow-800", text: "Stock Bajo" }
    return { status: "normal", color: "bg-green-100 text-green-800", text: "Stock Normal" }
  }

  const totalTools = tools.reduce((sum, tool) => sum + tool.quantity, 0)
  const lowStockCount = tools.filter((tool) => tool.quantity <= (tool.min_stock || 1)).length
  const outOfStockCount = tools.filter((tool) => tool.quantity === 0).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <div className="flex gap-4 text-sm text-gray-600 mt-1">
            <span>Total: {totalTools} herramientas</span>
            {lowStockCount > 0 && <span className="text-yellow-600">Stock bajo: {lowStockCount}</span>}
            {outOfStockCount > 0 && <span className="text-red-600">Sin stock: {outOfStockCount}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Tipo de Herramienta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddToolType} className="space-y-4">
                <div>
                  <Label htmlFor="typeName">Nombre del Tipo *</Label>
                  <Input
                    id="typeName"
                    value={newToolType.name}
                    onChange={(e) => setNewToolType({ ...newToolType, name: e.target.value })}
                    placeholder="ej. Martillos, Destornilladores"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="typeDescription">Descripción</Label>
                  <Textarea
                    id="typeDescription"
                    value={newToolType.description}
                    onChange={(e) => setNewToolType({ ...newToolType, description: e.target.value })}
                    placeholder="Descripción opcional del tipo de herramienta"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Agregar Tipo de Herramienta
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Herramienta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Herramienta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTool} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toolName">Nombre de la Herramienta *</Label>
                    <Input
                      id="toolName"
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      placeholder="ej. Martillo de Garra 16oz"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toolType">Tipo de Herramienta *</Label>
                    <Select
                      value={newTool.tool_type_id}
                      onValueChange={(value) => setNewTool({ ...newTool, tool_type_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {toolTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={newTool.quantity}
                      onChange={(e) => setNewTool({ ...newTool, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Stock Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={newTool.min_stock}
                      onChange={(e) => setNewTool({ ...newTool, min_stock: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={newTool.location}
                      onChange={(e) => setNewTool({ ...newTool, location: e.target.value })}
                      placeholder="ej. Estante A1, Cajón B2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condición</Label>
                    <Select
                      value={newTool.condition}
                      onValueChange={(value) => setNewTool({ ...newTool, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excelente</SelectItem>
                        <SelectItem value="good">Buena</SelectItem>
                        <SelectItem value="fair">Regular</SelectItem>
                        <SelectItem value="poor">Mala</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={newTool.notes}
                    onChange={(e) => setNewTool({ ...newTool, notes: e.target.value })}
                    placeholder="Notas adicionales sobre la herramienta"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Agregar Herramienta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Buscar herramientas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="typeFilter">Filtrar por Tipo</Label>
          <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tipos</SelectItem>
              {toolTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="stockFilter">Filtrar por Stock</Label>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el Stock</SelectItem>
              <SelectItem value="low">Stock Bajo</SelectItem>
              <SelectItem value="out">Sin Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cuadrícula de Herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const stockStatus = getStockStatus(tool)
          return (
            <Card key={tool.id} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium pr-2">{tool.name}</CardTitle>
                <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary">{tool.tool_types.name}</Badge>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{tool.quantity}</span>
                    <Badge className={stockStatus.color}>{stockStatus.text}</Badge>
                  </div>

                  {tool.location && <div className="text-sm text-gray-500">📍 {tool.location}</div>}

                  {tool.condition !== "good" && (
                    <div className="text-sm">
                      Estado: <span className="capitalize">{tool.condition}</span>
                    </div>
                  )}

                  {stockStatus.status !== "normal" && (
                    <div className="flex items-center text-sm text-orange-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {stockStatus.status === "out" ? "Reabastecer urgente" : `Min: ${tool.min_stock || 1}`}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTool(tool)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteTool(tool.id, tool.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron herramientas</h3>
          <p className="text-gray-500">
            {searchTerm || selectedTypeFilter !== "all" || stockFilter !== "all"
              ? "Intenta ajustar los filtros para ver más resultados."
              : "Agrega tu primera herramienta para comenzar."}
          </p>
        </div>
      )}

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Herramienta</DialogTitle>
          </DialogHeader>
          {editingTool && (
            <form onSubmit={handleEditTool} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editToolName">Nombre de la Herramienta</Label>
                  <Input
                    id="editToolName"
                    value={editingTool.name}
                    onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editToolType">Tipo de Herramienta</Label>
                  <Select
                    value={editingTool.tool_type_id.toString()}
                    onValueChange={(value) => setEditingTool({ ...editingTool, tool_type_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toolTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editQuantity">Cantidad</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    min="0"
                    value={editingTool.quantity}
                    onChange={(e) => setEditingTool({ ...editingTool, quantity: Number.parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editMinStock">Stock Mínimo</Label>
                  <Input
                    id="editMinStock"
                    type="number"
                    min="0"
                    value={editingTool.min_stock || ""}
                    onChange={(e) =>
                      setEditingTool({
                        ...editingTool,
                        min_stock: e.target.value ? Number.parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="editLocation">Ubicación</Label>
                  <Input
                    id="editLocation"
                    value={editingTool.location || ""}
                    onChange={(e) => setEditingTool({ ...editingTool, location: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="editCondition">Condición</Label>
                  <Select
                    value={editingTool.condition}
                    onValueChange={(value) => setEditingTool({ ...editingTool, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Buena</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Mala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editNotes">Notas</Label>
                <Textarea
                  id="editNotes"
                  value={editingTool.notes || ""}
                  onChange={(e) => setEditingTool({ ...editingTool, notes: e.target.value || null })}
                />
              </div>
              <Button type="submit" className="w-full">
                Actualizar Herramienta
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteTypeDialogOpen(true)}
          >
            Eliminar Tipo de Herramienta
          </Button>
          <Dialog open={isDeleteTypeDialogOpen} onOpenChange={setIsDeleteTypeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Tipo de Herramienta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Label htmlFor="deleteToolType">Selecciona el tipo a eliminar</Label>
                <Select
                  value={selectedTypeToDelete}
                  onValueChange={setSelectedTypeToDelete}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {toolTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  disabled={!selectedTypeToDelete}
                  onClick={async () => {
                    const type = toolTypes.find((t) => t.id.toString() === selectedTypeToDelete)
                    if (type) await handleDeleteToolType(type.id, type.name)
                    setIsDeleteTypeDialogOpen(false)
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
