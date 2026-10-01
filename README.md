# Kilo

PWA para registrar rutinas, series, repeticiones, peso y notas de entrenamiento. Cada cuenta es independiente y privada.

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- PWA instalable con caché offline del app shell

## Arranque local

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000` (o el puerto disponible que muestre Next).

## Conectar Supabase

1. Crea un proyecto en Supabase y habilita **Email / Magic Link** en Authentication.
2. Ejecuta [supabase/schema.sql](./supabase/schema.sql) en el SQL Editor. Crea perfiles automáticos, rutinas, entrenamientos, series y políticas RLS por usuario.
3. Copia `.env.example` como `.env.local` y coloca la URL y la clave publishable de tu proyecto.
4. Configura la URL local y la URL de producción en **Authentication → URL Configuration** para que funcione el enlace de acceso.

Cada cuenta ve y edita solo sus propias rutinas y entrenamientos (RLS por `user_id`).

## Validación

```bash
pnpm exec next build --webpack
```

Se usa Webpack para la comprobación porque Turbopack puede requerir un puerto auxiliar no disponible en algunos entornos aislados.
