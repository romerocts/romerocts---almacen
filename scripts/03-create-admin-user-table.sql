-- Tabla para usuario administrador único
CREATE TABLE IF NOT EXISTS public.admin_user (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insertar usuario admin inicial (puedes cambiar la contraseña luego)
INSERT INTO public.admin_user (email, password)
VALUES ('ferreteria@araque.com', 'admin1234')
ON CONFLICT (email) DO NOTHING;
