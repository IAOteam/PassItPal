## 2023-10-27 - Icon-Only Button Accessibility Pattern
**Learning:** Found a recurring pattern in the application where icon-only interactive elements (like the Lucide icons in buttons, Ant Design icons in nav items, and bare buttons with SVGs) were missing `aria-label`s, which affects screen reader compatibility and accessibility.
**Action:** Always verify that interactive icon components (e.g., `<Button size="icon"><Icon/></Button>` or `<button><Icon/></button>`) have a descriptive `aria-label` associated with them to ensure keyboard/screen reader navigability and standard adherence.
