# Puesta en marcha del panel

El panel usa Supabase Auth para el acceso, Postgres para productos y menús semanales, y Supabase Storage para las fotos. Las reglas de acceso viven en Postgres (RLS); la clave pública del navegador no concede permisos de administración.

## Conectar Supabase

1. Creá un proyecto en Supabase.
2. Copiá `.env.example` a `.env.local` y completá la URL del proyecto y la clave `anon`/publishable desde **Project Settings → API Keys**. Cuando tengas el dominio del sitio, completá también `NEXT_PUBLIC_SITE_URL` con su origen (por ejemplo, `https://tu-dominio.com`) para que las tarjetas de compartir usen URLs públicas correctas. No agregues una `service_role` ni la expongas al navegador.
3. Aplicá `supabase/migrations/20261004000000_initial_menu_admin.sql` desde el SQL Editor de Supabase. Alternativamente, inicializá Supabase CLI (`npx supabase init`), iniciá sesión (`npx supabase login`), vinculá el proyecto (`npx supabase link --project-ref TU_PROJECT_REF`) y ejecutá `npx supabase db push`.
4. En **Authentication → Users**, creá la cuenta de la clienta y verificá el correo.
5. Copiá el UUID de esa cuenta y autorizala desde el SQL Editor:

   ```sql
   insert into public.admin_users (user_id)
   values ('UUID-DE-LA-CUENTA');
   ```

6. Desactivá el registro público de usuarios en Authentication. Para sumar otro administrador, creá su usuario y agregá su UUID a `admin_users`.
7. Configurá las variables de Supabase y `NEXT_PUBLIC_SITE_URL` en el servicio donde se despliegue el sitio y publicá de nuevo.

El bucket público `dish-images` y sus políticas se crean con la migración. Solo administradores autorizados pueden subir, reemplazar o borrar archivos. Cada archivo admite JPG, PNG y WebP de hasta 5 MB.

## Uso

- Entrá a `/admin/login` con la cuenta autorizada.
- Creá productos con nombre, categoría, descripción, precio e imagen. Desactivar un producto lo retira del catálogo activo sin borrar su historial.
- Creá un menú, elegí sus fechas y platos, y guardalo como borrador o publicalo. Se puede definir un precio especial por plato para esa semana.
- Solo aparece en la web pública el menú publicado cuyas fechas incluyen el día actual en Argentina. La base impide publicar menús con períodos superpuestos.
- Los menús vencidos dejan de mostrarse automáticamente; se pueden archivar desde el panel.

Mientras no se configuren Supabase, el menú público usa una carta de muestra local claramente identificada: las fotos, los platos y los precios son ilustrativos, y los mensajes de WhatsApp solicitan confirmar menú, valores y disponibilidad. El panel de administración sigue requiriendo conexión a Supabase y no guarda cambios localmente. Al configurar Supabase, la carta pasa automáticamente a leer el menú publicado desde la base.
