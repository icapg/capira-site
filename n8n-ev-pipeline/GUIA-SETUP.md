# Pipeline Automatizado: Noticias EV → Resumen → Carpincho → LinkedIn

## Arquitectura del Pipeline

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   RSS Feeds     │     │   Claude AI  │     │    D-ID API      │
│  • Electrek     │────▶│  Resumen ES  │────▶│ Video Carpincho  │
│  • InsideEVs    │     │  + Script    │     │ (avatar parlante) │
│  • CleanTechnica│     └──────────────┘     └──────────────────┘
└─────────────────┘              │                     │
                                 ▼                     ▼
                          ┌──────────────────────────────┐
                          │     LinkedIn Post            │
                          │  Texto + Video Carpincho     │
                          └──────────────────────────────┘
```

**Frecuencia:**
- **Lunes 8am**: Resumen semanal completo (todas las noticias de la semana)
- **Miércoles y Viernes 10am**: Post corto sobre la noticia más relevante del momento

---

## Paso 1: Instalar n8n

Si aún no tenés n8n instalado:

```bash
# Opción A: Docker (recomendado)
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# Opción B: npm
npm install n8n -g
n8n start

# Opción C: n8n Cloud (sin instalación)
# Ir a https://app.n8n.cloud y crear cuenta
```

---

## Paso 2: Obtener API Keys

Necesitás 3 credenciales:

### 2.1 Anthropic (Claude) API Key
1. Ir a https://console.anthropic.com
2. Crear cuenta o iniciar sesión
3. Ir a **API Keys** → **Create Key**
4. Copiar la key (empieza con `sk-ant-...`)
5. Costo estimado: ~$0.02-0.05 por ejecución

### 2.2 D-ID API Key
1. Ir a https://www.d-id.com/api/
2. Crear cuenta gratuita (viene con créditos de prueba)
3. Ir a **Settings** → **API Keys** → **Generate**
4. Copiar la key
5. Plan gratuito: ~5 minutos de video/mes
6. Plan Lite ($16/mes): ~15 minutos de video/mes
7. **Nota**: Para ~12 videos/mes de 20-30s, el plan gratuito es justo. El Lite alcanza cómodo.

### 2.3 LinkedIn OAuth2
1. Ir a https://www.linkedin.com/developers/
2. **Create App** → llenar datos de tu empresa/perfil
3. En la app, ir a **Auth** tab
4. Anotar: **Client ID** y **Client Secret**
5. En **Products**, solicitar acceso a **Share on LinkedIn** y **Sign In with LinkedIn using OpenID Connect**
6. Configurar Redirect URL: `https://TU-N8N-URL/rest/oauth2-credential/callback`
7. **Importante**: La aprobación puede tardar unas horas

---

## Paso 3: Imagen del Carpincho

Necesitás una imagen frontal de un carpincho que D-ID usará como avatar parlante.

**Opciones:**
- Generá una con AI (DALL-E, Midjourney): prompt sugerido: *"Friendly capybara wearing glasses, professional headshot, front-facing, neutral background, photorealistic"*
- Usá una foto real de un carpincho mirando a cámara
- La imagen debe estar **hosteada en una URL pública** (podés subirla a Imgur, Cloudinary, etc.)

**Requisitos de D-ID para la imagen:**
- Formato: JPG o PNG
- Resolución mínima: 256x256
- La cara debe ser claramente visible y de frente
- Fondo simple

---

## Paso 4: Configurar Credenciales en n8n

Una vez en n8n (http://localhost:5678):

### 4.1 Credencial Anthropic
1. Ir a **Settings** → **Credentials** → **Add Credential**
2. Buscar **Anthropic**
3. Pegar tu API Key
4. Guardar

### 4.2 Credencial D-ID (HTTP Header Auth)
1. **Add Credential** → buscar **Header Auth**
2. Name: `D-ID API Key`
3. Header Name: `Authorization`
4. Header Value: `Basic TU_API_KEY_EN_BASE64`
   - Para convertir: en terminal correr `echo -n "tu-api-key:" | base64`
4. Guardar

### 4.3 Credencial LinkedIn OAuth2
1. **Add Credential** → buscar **LinkedIn OAuth2 API**
2. Pegar Client ID y Client Secret
3. Click en **Connect** → te redirige a LinkedIn para autorizar
4. Guardar

---

## Paso 5: Importar los Workflows

1. Ir a **Workflows** → **Import from File**
2. Importar `workflow-resumen-semanal.json` (resumen de los lunes)
3. Importar `workflow-posts-midweek.json` (posts de mié/vie)

### Después de importar, actualizar:
- En cada nodo de **Claude**: seleccionar tu credencial Anthropic
- En cada nodo de **D-ID**: seleccionar tu credencial Header Auth
- En cada nodo de **LinkedIn**: seleccionar tu credencial LinkedIn OAuth2
- En los nodos D-ID, reemplazar `{{$credentials.carpinchoImageUrl}}` con la URL real de tu imagen del carpincho

---

## Paso 6: Test Manual

1. Abrir el workflow semanal
2. Click en **Execute Workflow** (botón de play)
3. Verificar que:
   - Los RSS feeds traen artículos
   - Claude genera el resumen en español + script del carpincho
   - D-ID genera el video (verificar que el ID se crea)
   - El video se descarga correctamente
   - El post se publica en LinkedIn

**Tip**: Podés ejecutar nodo por nodo haciendo click en cada uno para debuggear paso a paso.

---

## Paso 7: Activar Automatización

Una vez que el test manual funciona:
1. Encender el toggle **Active** en cada workflow
2. Listo — los workflows van a correr solos según el schedule

---

## Personalización

### Agregar más fuentes RSS
Duplicá un nodo RSS y cambiá la URL. Algunas fuentes útiles:
- **Movilidad eléctrica en español:**
  - Forococheselectricos.com: `https://forococheselectricos.com/feed`
  - Motorpasion (sección EV): buscar su feed RSS
- **YouTube** (requiere nodo HTTP + YouTube API):
  - Se puede agregar un nodo que busque videos recientes de canales específicos

### Cambiar la voz del carpincho
En el nodo D-ID, podés cambiar `voice_id`. Opciones en español:
- `es-AR-TomasNeural` (argentino masculino)
- `es-AR-ElenaNeural` (argentino femenino)
- `es-MX-DaliaNeural` (mexicano femenino)
- `es-ES-AlvaroNeural` (español de España)

### Agregar paso de aprobación
Si querés revisar antes de publicar, agregá un nodo **Wait** con webhook antes del nodo LinkedIn. Te llega un mail/notificación para aprobar.

---

## Costos Estimados Mensuales

| Servicio | Uso mensual | Costo estimado |
|----------|------------|----------------|
| n8n | Self-hosted o Cloud Starter | $0 - $24/mes |
| Anthropic (Claude) | ~12 llamadas/mes | ~$0.30-0.60/mes |
| D-ID | ~12 videos de 20-30s | $0 (free tier) - $16/mes |
| **Total** | | **$0.30 - $40/mes** |

---

## Troubleshooting

**D-ID dice "insufficient credits"**
→ Verificá tu plan en d-id.com/account. El free tier tiene límite mensual.

**LinkedIn dice "unauthorized"**
→ El token OAuth2 puede expirar. Reconectá la credencial en n8n.

**Claude no genera buen contenido**
→ Ajustá el prompt en el nodo Claude. Podés cambiar temperatura, agregar ejemplos de posts que te gusten.

**Los RSS no traen artículos**
→ Verificá que las URLs de los feeds siguen activas visitándolas en el navegador.
