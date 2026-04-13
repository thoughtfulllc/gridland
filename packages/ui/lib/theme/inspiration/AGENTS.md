# Deriving Theme Tokens from tmTheme Files

When updating a theme to match a `.tmTheme` file, map the syntax scopes to the 9 theme tokens as follows:

## Mapping Rules

| Theme Token | tmTheme Source | Scope/Setting |
|-------------|---------------|---------------|
| `primary` | Keyword color | `keyword`, `storage` |
| `accent` | Function/entity color | `entity.name.function`, `entity.other.attribute-name` |
| `secondary` | Type/support color | `storage.type`, `support.function`, `support.class` |
| `muted` | Comment color | `comment` |
| `border` | Comment color (same as muted) | `comment` |
| `text` | Global foreground | Top-level `settings.foreground` |
| `success` | Function/entity color (same as accent) | `entity.name.function` |
| `error` | Keyword color (same as primary) | `keyword` |
| `warning` | Parameter/argument color | `variable.parameter` |

## Process

1. Open the `.tmTheme` XML file
2. Find the top-level `<dict>` under `<array>` with no `name`/`scope` — this contains global settings (`background`, `foreground`, `selection`, etc.)
3. For each scope listed above, find its `<dict>` entry and extract the `foreground` hex color
4. Use hex values directly in the theme (the color system supports `#rrggbb` format via `parseColor()`)

## Semantic Fallbacks

The primary mapping scopes don't always produce semantically appropriate colors in every theme. When a mapped color doesn't make sense for the token's purpose, use these fallbacks:

| Token | Fallback Scopes | When to use fallback |
|-------|----------------|----------------------|
| `success` | `entity.name.tag`, `markup.inserted`, `diffAdded` | When the primary scope (entity.name.function) isn't green or doesn't convey "success" |
| `warning` | `variable`, `markup.changed`, `sublimelinter.mark.warning`, `findHighlight` | When `variable.parameter` matches the foreground or is otherwise indistinct |
| `error` | `invalid.illegal`, `markup.deleted`, `message.error`, `sublimelinter.mark.error` | When the keyword color is too similar to another token |

The goal is semantic fit: `success` should feel positive (green), `warning` should feel cautionary (orange/yellow), and `error` should feel urgent (red). If the primary mapping produces a color that contradicts these expectations, prefer a fallback scope that exists in the theme.

## Rationale

- **primary/error** use the keyword color because it's the most visually dominant and attention-grabbing — appropriate for primary UI elements and error states
- **accent/success** use the function/entity color because it's the second most prominent and has a positive connotation (green in most themes)
- **secondary** uses the type color as a supporting/informational tone
- **muted/border** use the comment color since comments are intentionally de-emphasized
- **text** uses the global foreground for maximum readability
- **warning** uses the parameter color which is typically orange/warm — a natural fit for warnings
