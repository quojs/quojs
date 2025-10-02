# Quo.js vs Redux Toolkit — Demo React con Vite (Rush Monorepo)

Un pequeño demo en React enfocado que hospeda **ambas implementaciones de estado** lado a lado:

- **Quo.js** (almacén personalizado estilo Redux con canales/eventos y suscripciones atómicas)
- **Redux Toolkit (RTK)** (stack Redux estándar con `createSlice` + `createAsyncThunk`)

Usa este proyecto para ejecutar la UI localmente y reproducir el **[Análisis con React Profiler](./redux-quojs-profiler.md)**.

## Estructura del proyecto

Ambas implementaciones exponen la misma UI y los mismos flujos (listar, agregar, actualizar, eliminar).  
El shell de comparación monta cada página bajo rutas separadas para poder perfilarlas de forma aislada.

- Ruta **/quojs** → Página de Quo.js envuelta en su propio provider  
- Ruta **/rtk** → Página de RTK envuelta en su propio provider  

La aplicación es un proyecto **Vite** que vive dentro de un **monorepo Rush**.

## Prerrequisitos

- **Node.js**: se recomienda LTS (ej. 18.x).  
- **pnpm**: usado por Rush para la gestión de dependencias  
  ```bash
  npm i -g pnpm
  ```
- **Rush** (CLI global)  
  ```bash
  npm i -g @microsoft/rush
  ```

## Clonar & bootstrap

Clona este repositorio, navega a la carpeta raíz y ejecuta los siguientes comandos en la terminal:

```bash
# Instala todas las dependencias del monorepo
rush install          # o: rush update

# (opcional) Compila todo
rush build
```

## Ejecutar la app (modo dev)

El shell de comparación es una app de Vite que enruta hacia cada implementación.

```bash
cd examples/quojs-in-react
rushx dev             # equivalente a: pnpm dev
```

Abre **http://localhost:5173** (o el puerto que muestre Vite).

- Visita **/quojs** para la página de Quo.js.  
- Visita **/rtk** para la página de RTK.  

## Build de producción & preview (para números de profiling estables)

Las builds de desarrollo incluyen comprobaciones extra (ej. React Strict Mode, transformaciones dev).  
Para tiempos más estables, perfila una **build de producción**:

```bash
cd examples/quojs-in-react
rushx build           # build de producción de Vite
rushx preview         # sirve la build de producción
# por defecto: http://localhost:4173
```

Luego abre `/quojs` o `/rtk` en el servidor de preview.

## Uso de React Profiler

1. **Instala React DevTools** en tu navegador (Chrome/Edge/Firefox).  
2. Abre tu app, luego abre DevTools → pestaña **Profiler**.  
3. En la barra de Profiler:  
   - Activa **“Record profiling”**.  
   - (Opcional) Habilita *“Record why each component rendered”* para más detalles.  
4. Interactúa con la página para capturar frames específicos:
   - **Agregar Tarea**: 
      1. __pega__ la palabla `prueba` en el campo `titulo` (hacemos esto para evitar muchos frames al escribir letra por letra)
      2. __pega__ la palabla `prueba` en el campo `categoría` (igual que arriba)
      3. Haz clic **Add** para crear una nueva tarea.
   - **Cambia los estatuses**: una vez agragada la nueva tarea, cambia el estatus de cada tarea (12 en total)
5. Inspecciona el _flamegraph_ de cada _commit_:  
   - ¿Qué componentes se re-renderizaron?  
   - ¿Cuánto tardó el _commit_?  
   - ¿Qué tanto del árbol fue invalidado?  

### Reproduciendo los frames documentados

| Qué capturar | Ruta | Interacción |
|---|---|---|
| Frame 1 (render inicial) | `/quojs` y `/rtk` | Iniciar recording → recargar página |
| Frame 39/31 (agregar todo) | `/quojs` y `/rtk` | Escribir título/categoría → **Add** |
| Frame 40/32 (toggle id=1) | `/quojs` y `/rtk` | Cambiar estatus de item id **1** |
| Frame 41/33 (toggle id=2) | `/quojs` y `/rtk` | Cambiar estatus de item id **2** |
| Frame 42/34 (toggle id=3) | `/quojs` y `/rtk` | Cambiar estatus de item id **3** |

> Quo.js debería mostrar **re-renders aislados por item** en los toggles, mientras que RTK típicamente re-renderiza la **lista completa** al cambiar la referencia de la colección.

### Exportar perfiles

En Profiler, haz click en **Save profile…** para exportar un `.json` que puedes guardar para reproducibilidad.

## Fuente de datos

El ejemplo de fetch usa **MSW** con datos mock de `https://jsonplaceholder.typicode.com/todos?id=0` por defecto.  
Puedes cambiarlo en las acciones/hooks si es necesario. El acceso a red no es requerido por defecto, pero debe estar permitido por tu navegador/proxy si deshabilitas MSW.

## Licencia

Este demo es para fines de comparación/documentación. Consulta la raíz del repositorio para detalles de licencia.
