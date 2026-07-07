# Mi Asistente — PWA

## Qué es esto
Tu asistente personal convertido en app instalable (PWA), con chat, tareas y notas
que se guardan en tu propio celular.

## Cómo publicarlo (con Vercel, gratis)

1. **Crea una cuenta en [vercel.com](https://vercel.com)** (puedes entrar con tu GitHub).
2. **Sube esta carpeta a un repositorio de GitHub**:
   ```bash
   cd mi-asistente
   git init
   git add .
   git commit -m "Mi asistente personal"
   git remote add origin https://github.com/TU_USUARIO/mi-asistente.git
   git push -u origin main
   ```
3. **En Vercel**: "Add New Project" → importa ese repositorio → deja la configuración por defecto (Vercel detecta Vite solo) → Deploy.
4. **Configura tu API key** (muy importante, sin esto el chat no funciona):
   - En el proyecto de Vercel: Settings → Environment Variables.
   - Nombre: `ANTHROPIC_API_KEY`, valor: tu clave de la consola de Anthropic (console.anthropic.com → API Keys).
   - Vuelve a hacer deploy para que tome la variable.
5. Vercel te da una URL tipo `https://mi-asistente.vercel.app`.

## Instalarlo en tu celular

- **Android (Chrome)**: abre la URL → menú (⋮) → "Instalar aplicación" o "Añadir a pantalla de inicio".
- **iPhone (Safari)**: abre la URL → botón compartir → "Añadir a pantalla de inicio".

Después de eso, el ícono queda en tu celular como cualquier otra app, abre a pantalla completa
y funciona offline para lo que ya tengas cargado (el chat sí necesita internet para responder).

## Nota sobre la API key
La función en `api/chat.js` actúa como intermediario: tu celular nunca ve la clave directamente,
solo Vercel la usa para hablar con Anthropic. Esto es más seguro que llamar a la API desde el navegador.

## Desarrollo local (opcional)
```bash
npm install
npm run dev
```
Para probar la API localmente necesitas la CLI de Vercel (`vercel dev`) o correr tu propio servidor
que exponga `/api/chat`.
