// Negative type checks: every @ts-expect-error must match a real type error.
// If any directive becomes "unused", tsc exits non-zero — the test fails.
import React from "react"

// Nonexistent elements are rejected
// @ts-expect-error — "notarealelement" is not in JSX.IntrinsicElements
const bad1 = <notarealelement />

// @ts-expect-error — "fakebox" is not in JSX.IntrinsicElements
const bad2 = <fakebox flexDirection="row" />

// Invalid prop values on typed elements are rejected
// @ts-expect-error — "banana" is not a valid flexDirection
const bad3 = <box flexDirection="banana" />

// @ts-expect-error — "bold" is not a valid borderStyle
const bad4 = <box borderStyle="bold" />

// @ts-expect-error — "auto" is not a valid overflow value
const bad5 = <box overflow="auto" />

// @ts-expect-error — "left" is not a valid flexWrap
const bad6 = <box flexWrap="left" />
