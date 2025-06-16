-- Eliminar tablas existentes si existen (en orden correcto por dependencias)
DROP TABLE IF EXISTS loan_items CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS tool_types CASCADE;

-- Crear tabla de tipos de herramientas
CREATE TABLE tool_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de herramientas
CREATE TABLE tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tool_type_id INTEGER NOT NULL REFERENCES tool_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock INTEGER DEFAULT 1,
  location VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de préstamos
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(200) NOT NULL,
  user_id_type VARCHAR(50) NOT NULL DEFAULT 'DNI' CHECK (user_id_type IN ('DNI', 'Pasaporte', 'Licencia')),
  user_id_number VARCHAR(50) NOT NULL,
  user_phone VARCHAR(20),
  user_email VARCHAR(100),
  loan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_return_date DATE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de elementos de préstamo
CREATE TABLE loan_items (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
  quantity_loaned INTEGER NOT NULL CHECK (quantity_loaned > 0),
  quantity_returned INTEGER DEFAULT 0 CHECK (quantity_returned >= 0),
  condition_loaned VARCHAR(50) DEFAULT 'good',
  condition_returned VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_returned_quantity CHECK (quantity_returned <= quantity_loaned)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_tools_tool_type_id ON tools(tool_type_id);
CREATE INDEX idx_tools_quantity ON tools(quantity);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_user_id_number ON loans(user_id_number);
CREATE INDEX idx_loans_loan_date ON loans(loan_date);
CREATE INDEX idx_loan_items_loan_id ON loan_items(loan_id);
CREATE INDEX idx_loan_items_tool_id ON loan_items(tool_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_tool_types_updated_at BEFORE UPDATE ON tool_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_items_updated_at BEFORE UPDATE ON loan_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear vista para estadísticas rápidas
CREATE VIEW loan_statistics AS
SELECT 
  COUNT(*) as total_loans,
  COUNT(*) FILTER (WHERE status = 'active') as active_loans,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_loans,
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue_loans,
  COUNT(DISTINCT user_id_number) as unique_users
FROM loans;

-- Crear vista para inventario con información de préstamos
CREATE VIEW inventory_status AS
SELECT 
  t.id,
  t.name,
  t.quantity as total_quantity,
  tt.name as tool_type,
  COALESCE(SUM(li.quantity_loaned - li.quantity_returned), 0) as quantity_on_loan,
  t.quantity - COALESCE(SUM(li.quantity_loaned - li.quantity_returned), 0) as available_quantity,
  t.min_stock,
  CASE 
    WHEN t.quantity - COALESCE(SUM(li.quantity_loaned - li.quantity_returned), 0) <= t.min_stock 
    THEN 'low_stock' 
    ELSE 'normal' 
  END as stock_status
FROM tools t
JOIN tool_types tt ON t.tool_type_id = tt.id
LEFT JOIN loan_items li ON t.id = li.tool_id
LEFT JOIN loans l ON li.loan_id = l.id AND l.status = 'active'
GROUP BY t.id, t.name, t.quantity, tt.name, t.min_stock;
