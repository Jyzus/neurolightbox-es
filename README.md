# Neuro Lightbox ES

Adaptación en español de Neuro Lightbox: recorrido interactivo de imagen cerebral con HTML, CSS, JavaScript y WebGL. El sitio listo para servir vive en `site/`; no requiere compilación de frontend ni servidor Node.js.

La carga inicial descarga todos los datos cerebrales (aproximadamente 23 MB), los procesa en un Worker cuando está disponible y mantiene la pantalla de carga hasta preparar el recorrido. Existe una ruta cooperativa de compatibilidad.

## Ejecutar con Docker

Desde la raíz del repositorio:

```bash
docker build -t neurolightbox-es:local .
docker run --rm --name neurolightbox-es -p 127.0.0.1:8080:80 neurolightbox-es:local
```

Abrir <http://localhost:8080>. El proceso Nginx escucha en el **puerto interno 80**. La imagen fija una versión Alpine oficial por digest y copia únicamente `site/` al directorio público; `orig/`, `tools/`, `tasks/` y Git quedan fuera del contexto de build.

El endpoint `GET /healthz` devuelve `200` y `ok`. El `HEALTHCHECK` incluido consulta ese endpoint cada 30 segundos, con timeout de 3 segundos, período inicial de 5 segundos y 3 intentos. El binario `wget` está incluido en la imagen base.

```bash
curl --fail http://localhost:8080/healthz
docker inspect --format '{{.State.Health.Status}}' neurolightbox-es
```

Los archivos sin hash utilizan `Cache-Control: no-cache`: el navegador puede guardarlos y revalidarlos. Nginx comprime texto, pero no recomprime los PNG binarios. Las rutas inexistentes devuelven `404`; no se utiliza fallback de SPA.

## Configurar en Coolify

Crear una aplicación desde el repositorio Git. Usar estos valores:

| Ajuste | Valor |
| --- | --- |
| Repositorio | `https://github.com/Jyzus/neurolightbox-es` |
| Build pack / Build strategy | `Dockerfile` |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `80` |
| Comando de inicio | El definido en la imagen; no sobrescribir |
| Variables de entorno y almacenamiento persistente | No se requieren |

El Dockerfile incluye el healthcheck. Para aplicaciones Dockerfile sin Compose, Coolify detecta ese control de la imagen y lo utiliza. Su ruta es `/healthz`, esquema `http` y puerto interno `80`.

En **Domains**, asignar el dominio deseado con `https://` y configurar su DNS hacia el servidor de Coolify. Coolify gestiona el proxy HTTPS y los certificados; el contenedor sigue sirviendo HTTP en el puerto 80. No hace falta publicar un puerto fijo del servidor ni configurar TLS dentro de Nginx.

Cuando se asigne el dominio definitivo, actualizar en `site/index.html` el enlace canónico y las URLs de Open Graph/Twitter, que actualmente conservan el dominio de origen. La imagen no realiza sustituciones automáticas de dominio.

Referencias oficiales: [Dockerfile en Coolify](https://coolify.io/docs/applications/builds/dockerfile) y [healthchecks](https://coolify.io/docs/applications/configuration/health-checks).

## Verificar

Con Node.js, Python 3 y Docker disponibles:

```bash
node --test tools/*.test.js
python3 tools/verify.py
python3 tools/verify_docker.py
```

La última prueba construye una imagen local, levanta un contenedor temporal en un puerto aleatorio de loopback, comprueba todos los archivos mediante HTTP, sus tipos MIME y bytes, los errores 404 y el estado `healthy`; luego elimina el contenedor de prueba.

Para el benchmark opcional de procesamiento de datos reales:

```bash
node tools/benchmark-loading.js
```

Ese benchmark requiere Pillow en el Python local y verifica igualdad de datos y cesión del procesamiento en Node; excluye el renderizado y el driver GPU del navegador. Los tiempos de una visita real quedan disponibles en `window.NeuroBoot.timings` y las entradas `neuro:` de Performance.

## Fuente y atribución

La copia fuente conservada en `orig/app.neurolightbox.workers.dev/` y sus metadatos identifican como origen [Neuro Lightbox](https://app.neurolightbox.workers.dev/). Esta adaptación conserva esa referencia; `orig/` no se sirve en la imagen Docker.

No se encontró una declaración general de licencia del código o los datos originales en la copia local. Este repositorio no les atribuye una licencia nueva. El archivo vendorizado de Three.js conserva su cabecera de copyright de Three.js Authors y su identificador de licencia MIT.
