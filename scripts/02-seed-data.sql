-- Insertar tipos de herramientas con descripciones
INSERT INTO tool_types (name, description) VALUES 
  ('Martillos', 'Herramientas para golpear y clavar'),
  ('Destornilladores', 'Herramientas para atornillar y desatornillar'),
  ('Llaves', 'Herramientas para apretar y aflojar tuercas y tornillos'),
  ('Taladros', 'Herramientas eléctricas para perforar'),
  ('Sierras', 'Herramientas para cortar madera y otros materiales'),
  ('Alicates', 'Herramientas para sujetar y cortar'),
  ('Niveles', 'Herramientas de medición y nivelación'),
  ('Medición', 'Herramientas de medición y marcado')
ON CONFLICT (name) DO NOTHING;

-- Insertar herramientas con información detallada
INSERT INTO tools (name, tool_type_id, quantity, min_stock, location, condition, purchase_date, purchase_price, notes) VALUES 
  -- Martillos
  ('Martillo de Garra 16oz', (SELECT id FROM tool_types WHERE name = 'Martillos'), 8, 2, 'Estante A1', 'excellent', '2024-01-15', 25.99, 'Mango de fibra de vidrio'),
  ('Martillo de Bola 12oz', (SELECT id FROM tool_types WHERE name = 'Martillos'), 5, 1, 'Estante A1', 'good', '2024-02-10', 18.50, 'Para trabajos de precisión'),
  ('Martillo Demoledor 3lb', (SELECT id FROM tool_types WHERE name = 'Martillos'), 3, 1, 'Estante A2', 'good', '2024-01-20', 45.00, 'Para trabajos pesados'),
  
  -- Destornilladores
  ('Destornillador Phillips #2', (SELECT id FROM tool_types WHERE name = 'Destornilladores'), 12, 3, 'Cajón B1', 'excellent', '2024-01-10', 8.99, 'Mango ergonómico'),
  ('Destornillador Plano 6mm', (SELECT id FROM tool_types WHERE name = 'Destornilladores'), 10, 3, 'Cajón B1', 'good', '2024-01-10', 7.50, 'Punta magnética'),
  ('Set Destornilladores Precisión', (SELECT id FROM tool_types WHERE name = 'Destornilladores'), 4, 1, 'Cajón B2', 'excellent', '2024-03-01', 35.00, 'Para electrónicos'),
  
  -- Llaves
  ('Llave Inglesa 10"', (SELECT id FROM tool_types WHERE name = 'Llaves'), 6, 2, 'Estante C1', 'good', '2024-01-25', 22.00, 'Apertura ajustable'),
  ('Set Llaves Combinadas', (SELECT id FROM tool_types WHERE name = 'Llaves'), 3, 1, 'Estante C1', 'excellent', '2024-02-15', 89.99, 'Tamaños 8-19mm'),
  ('Llave de Tubo 1/2"', (SELECT id FROM tool_types WHERE name = 'Llaves'), 4, 1, 'Estante C2', 'good', '2024-01-30', 15.75, 'Para plomería'),
  
  -- Taladros
  ('Taladro Inalámbrico 18V', (SELECT id FROM tool_types WHERE name = 'Taladros'), 4, 1, 'Armario D1', 'excellent', '2024-03-10', 125.00, 'Incluye 2 baterías'),
  ('Taladro Percutor 800W', (SELECT id FROM tool_types WHERE name = 'Taladros'), 2, 1, 'Armario D1', 'good', '2024-02-20', 95.50, 'Para concreto y mampostería'),
  ('Taladro de Banco', (SELECT id FROM tool_types WHERE name = 'Taladros'), 1, 1, 'Taller Principal', 'excellent', '2024-01-05', 280.00, 'Uso estacionario'),
  
  -- Sierras
  ('Sierra Circular 7 1/4"', (SELECT id FROM tool_types WHERE name = 'Sierras'), 3, 1, 'Armario E1', 'good', '2024-02-25', 110.00, 'Para madera y contrachapado'),
  ('Sierra de Mano 22"', (SELECT id FROM tool_types WHERE name = 'Sierras'), 8, 2, 'Estante E2', 'good', '2024-01-12', 28.50, 'Dientes templados'),
  ('Sierra Caladora', (SELECT id FROM tool_types WHERE name = 'Sierras'), 2, 1, 'Armario E1', 'excellent', '2024-03-05', 75.00, 'Cortes curvos y rectos'),
  
  -- Alicates
  ('Alicates Universales 8"', (SELECT id FROM tool_types WHERE name = 'Alicates'), 10, 2, 'Cajón F1', 'good', '2024-01-08', 16.99, 'Mango aislado'),
  ('Alicates de Punta', (SELECT id FROM tool_types WHERE name = 'Alicates'), 8, 2, 'Cajón F1', 'excellent', '2024-01-15', 14.50, 'Para trabajos de precisión'),
  ('Cortaalambres', (SELECT id FROM tool_types WHERE name = 'Alicates'), 6, 1, 'Cajón F2', 'good', '2024-02-01', 19.75, 'Corte limpio'),
  
  -- Niveles
  ('Nivel de Burbuja 24"', (SELECT id FROM tool_types WHERE name = 'Niveles'), 5, 1, 'Estante G1', 'excellent', '2024-01-18', 32.00, 'Aluminio reforzado'),
  ('Nivel Láser', (SELECT id FROM tool_types WHERE name = 'Niveles'), 2, 1, 'Armario G2', 'excellent', '2024-03-15', 185.00, 'Autonivelante'),
  
  -- Medición
  ('Cinta Métrica 5m', (SELECT id FROM tool_types WHERE name = 'Medición'), 15, 3, 'Cajón H1', 'good', '2024-01-05', 12.99, 'Cinta reforzada'),
  ('Escuadra de Carpintero', (SELECT id FROM tool_types WHERE name = 'Medición'), 6, 2, 'Estante H2', 'excellent', '2024-01-22', 24.50, 'Acero inoxidable'),
  ('Calibrador Digital', (SELECT id FROM tool_types WHERE name = 'Medición'), 3, 1, 'Cajón H3', 'excellent', '2024-02-28', 45.00, 'Precisión 0.01mm')
ON CONFLICT DO NOTHING;

-- Insertar algunos préstamos de ejemplo
INSERT INTO loans (user_name, user_id_type, user_id_number, user_phone, user_email, expected_return_date, status, notes) VALUES 
  ('Juan Pérez', 'DNI', '12345678', '555-0101', 'juan.perez@email.com', CURRENT_DATE + INTERVAL '7 days', 'active', 'Cliente frecuente'),
  ('María González', 'DNI', '87654321', '555-0102', 'maria.gonzalez@email.com', CURRENT_DATE + INTERVAL '3 days', 'active', 'Proyecto de renovación'),
  ('Carlos Rodríguez', 'Pasaporte', 'AB123456', '555-0103', 'carlos.rodriguez@email.com', CURRENT_DATE - INTERVAL '2 days', 'completed', 'Devuelto en buen estado')
ON CONFLICT DO NOTHING;

-- Insertar elementos de préstamo de ejemplo
INSERT INTO loan_items (loan_id, tool_id, quantity_loaned, condition_loaned, notes) VALUES 
  -- Préstamo de Juan Pérez
  (1, (SELECT id FROM tools WHERE name = 'Taladro Inalámbrico 18V'), 1, 'excellent', 'Incluye brocas básicas'),
  (1, (SELECT id FROM tools WHERE name = 'Nivel de Burbuja 24"'), 1, 'excellent', ''),
  
  -- Préstamo de María González  
  (2, (SELECT id FROM tools WHERE name = 'Sierra Circular 7 1/4"'), 1, 'good', 'Revisar hoja antes de uso'),
  (2, (SELECT id FROM tools WHERE name = 'Cinta Métrica 5m'), 2, 'good', ''),
  
  -- Préstamo completado de Carlos
  (3, (SELECT id FROM tools WHERE name = 'Martillo de Garra 16oz'), 1, 'excellent', 'Devuelto limpio')
ON CONFLICT DO NOTHING;

-- Actualizar quantity_returned para el préstamo completado
UPDATE loan_items SET quantity_returned = quantity_loaned, condition_returned = 'excellent' 
WHERE loan_id = 3;
