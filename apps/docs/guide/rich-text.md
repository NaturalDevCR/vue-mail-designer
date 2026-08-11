# Rich text editor

The **Text** block uses a rich editor (Tiptap) with:

- Bold, italic, underline, strikethrough
- Lists (bullet and numbered)
- Paragraph alignment
- Text color and font size
- Links
- Variables (merge tags) — see below
- Clear formatting

## Merge tags

`mergeTags` defines the variables the user can insert from the editor toolbar:

```ts
const mergeTags: MergeTagDef[] = [
  { name: 'First name', value: 'first_name' },
  { name: 'Company', value: 'company' },
]
```

It also accepts groups, shown as optgroups:

```ts
const mergeTags = [
  { name: 'Contact', tags: [{ name: 'First name', value: 'first_name' }] },
  { name: 'Account', tags: [{ name: 'Plan', value: 'plan_name' }] },
]
```

In the exported HTML, each variable is emitted as `{{value}}` — your sending platform's engine is the one that replaces them at send time. The library performs no replacement of its own.

## Link color and underline

By default, links inside a text block inherit `linkColor`/`linkUnderline` from the document (**Body** tab). A given text block can opt out of that inheritance and set its own link color/underline from its inspector.

## Special links

`specialLinks` adds predefined links to the editor's selector (for example, an unsubscribe link resolved by your sending platform):

```ts
const specialLinks = [{ name: 'Unsubscribe', href: '{{unsubscribe_url}}' }]
```

## Chrome AI tools

The editor can optionally show Chrome built-in AI actions for rewriting, writing, summarizing, and translating text. Enable them with the public `ai` prop; browser availability is detected at runtime and generated content is applied only after the user chooses **Apply**.

See [Chrome AI tools](/guide/chrome-ai) for configuration and browser requirements.
