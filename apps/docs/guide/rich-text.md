# Editor de texto

El bloque **Texto** usa un editor enriquecido (Tiptap) con:

- Negrita, cursiva, subrayado, tachado
- Listas (viñeta y numerada)
- Alineación de párrafo
- Color de texto y tamaño de fuente
- Enlaces
- Variables (merge tags) — ver abajo
- Limpiar formato

## Merge tags

`mergeTags` define las variables que el usuario puede insertar desde la barra del editor:

```ts
const mergeTags: MergeTagDef[] = [
  { name: 'Nombre', value: 'first_name' },
  { name: 'Empresa', value: 'company' },
]
```

También acepta grupos, que se muestran como optgroups:

```ts
const mergeTags = [
  { name: 'Contacto', tags: [{ name: 'Nombre', value: 'first_name' }] },
  { name: 'Cuenta', tags: [{ name: 'Plan', value: 'plan_name' }] },
]
```

En el HTML exportado, cada variable se emite como `{{value}}` — el motor de tu plataforma de envío es quien las reemplaza en el momento de mandar el correo. La librería no hace ningún reemplazo por su cuenta.

## Color y subrayado de links

Por defecto, los links dentro de un bloque de texto heredan `linkColor`/`linkUnderline` del documento (pestaña **Cuerpo**). Un bloque de texto puntual puede desactivar esa herencia y fijar su propio color/subrayado desde su inspector.

## Enlaces especiales

`specialLinks` agrega enlaces predefinidos al selector del editor (por ejemplo, un link de cancelar suscripción que tu plataforma resuelve del lado del envío):

```ts
const specialLinks = [{ name: 'Cancelar suscripción', href: '{{unsubscribe_url}}' }]
```
