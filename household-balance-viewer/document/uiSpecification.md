# Budget App UI Specification (Antigravity)

## 0. Principles

* Minimal UI (no decorative colors)
* Mobile-first
* Color = meaning only
* Emphasis = typography, not decoration
* Balance is the only element allowed to be visually dominant

---

## 1. Design Tokens

### 1.1 Base Colors

```ts
export const base = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
};
```

---

### 1.2 Semantic Colors

```ts
export const semantic = {
  income: "#5FBDFF",
  expense: "#7B66FF",
  neutral: "#96EFFF",
  strong: "#7B66FF", // ONLY for balance
};
```

---

### 1.3 Color Rules (STRICT)

* `strong` is ONLY allowed for balance display
* Max 2 semantic colors per screen
* No background usage of semantic colors
* No gradients

---

## 2. Typography

### 2.1 Font

* System font stack
* No custom font

---

### 2.2 Scale

```ts
export const fontSize = {
  balance: 28,
  amount: 20,
  body: 16,
  label: 13,
};
```

---

### 2.3 Weight

```ts
export const fontWeight = {
  bold: 700,
  regular: 400,
  light: 300,
};
```

---

### 2.4 Rules

* Balance: largest + bold
* Amount: medium + regular
* Labels: small + secondary color

---

## 3. Spacing System

### 3.1 Grid

* 8px base grid

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};
```

---

### 3.2 Rules

* Section gap: `lg`
* Component gap: `md`
* Inner gap: `sm`

---

## 4. Layout

* Single column layout
* No multi-column UI
* Max width is device width
* Horizontal padding: 16px

---

## 5. Components

---

### 5.1 Balance Display (CRITICAL COMPONENT)

#### Purpose

Primary focus of the screen

#### Rules

* Use `semantic.strong`
* Largest font size
* Top of screen
* No competing elements

#### Example

```tsx
<Text style={{
  fontSize: fontSize.balance,
  fontWeight: fontWeight.bold,
  color: semantic.strong
}}>
  ¥120,000
</Text>
```

---

### 5.2 Budget Row

#### Structure

```
[Category Name]        [Amount]
```

or

```
[Category Name]        [Used / Budget]
```

#### Rules

* Single line only
* No progress bar
* No icons by default
* Truncate long text

#### Example

```tsx
<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
  <Text>Food</Text>
  <Text>¥30,000</Text>
</View>
```

---

### 5.3 Editable Text (Tap to Edit)

#### Behavior

* Default: Text display
* On tap: تبدیل to input
* On blur or enter: commit change

#### Rules

* No visible border in display mode
* Input mode only shows minimal underline

---

### 5.4 Card

```ts
export const card = {
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 16,
};
```

#### Rules

* Minimal shadow (or none)
* Separation via spacing, not color

---

### 5.5 Button

#### Primary

```ts
{
  backgroundColor: semantic.income,
  color: "#FFFFFF"
}
```

#### Secondary

```ts
{
  borderColor: base.border,
  borderWidth: 1,
}
```

---

## 6. Interaction Rules

* Tap area ≥ 44px
* No animation unless necessary
* Immediate feedback on edit
* Avoid modal if inline edit is possible

---

## 7. Anti-Patterns (STRICTLY FORBIDDEN)

* Adding colors for decoration
* Progress bars in budget list
* Multiple emphasis elements
* Inconsistent spacing
* Different styles per screen

---

## 8. Priority Rules

When conflicts happen:

1. Readability
2. Consistency
3. Minimalism
4. Semantic correctness

---

## 9. Definition of Done (UI)

* Balance is visually dominant
* Screen uses ≤ 2 semantic colors
* No unnecessary elements exist
* All spacing follows 8px grid
* Same component = same appearance everywhere

## 10. UI Refactoring Constraints

### Purpose

This phase is strictly for visual adjustments only.

---

### Allowed Changes

* Styling (color, spacing, typography)
* Layout adjustments (alignment, padding, margin)
* Component structure that does NOT affect behavior

---

### Forbidden Changes (STRICT)

* Modifying business logic
* Changing callback behavior or timing
* Adding or removing data fields
* Changing data flow or state management
* Altering API requests or responses
* Introducing new side effects

---

### Rules

* UI changes MUST be presentation-only
* Existing props and callbacks MUST remain unchanged
* Same input MUST produce same output (data-wise)

---

### Guideline

> If a change affects logic, data, or behavior, it is NOT part of this phase.

---

### Review Criteria

* No diff in logic layer
* No diff in data structure
* No diff in callback execution timing
* Visual output only is changed
