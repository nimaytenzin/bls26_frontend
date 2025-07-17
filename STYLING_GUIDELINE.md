# Movie Booking App - Styling Guideline

## Overview
This document provides comprehensive styling guidelines for the Movie Booking App, ensuring consistent design patterns across all components using Tailwind CSS and PrimeNG.

## Design System

### Color Palette

#### Primary Colors
- **Blue**: `blue-500` (#3b82f6) - Primary actions, links
- **Indigo**: `indigo-600` (#4f46e5) - Secondary actions, accents
- **Purple**: `purple-500` (#8b5cf6) - Gradients, highlights

#### Neutral Colors
- **Slate-50**: Background surfaces
- **Slate-100**: Light borders, dividers
- **Slate-200**: Medium borders, inactive states
- **Slate-600**: Secondary text
- **Slate-700**: Labels, medium emphasis text
- **Slate-800**: Primary text, headings
- **White**: Cards, dialogs, primary surfaces

#### Status Colors
- **Green-500**: Success states, confirmations
- **Red-500**: Errors, deletions, warnings
- **Yellow-500**: Warnings, pending states
- **Orange-500**: Notifications, alerts

### Typography

#### Headings
```html
<!-- Main Page Title -->
<h1 class="text-3xl sm:text-4xl font-bold text-slate-800">Page Title</h1>

<!-- Section Headers -->
<h2 class="text-2xl font-bold text-slate-800">Section Title</h2>

<!-- Subsection Headers -->
<h3 class="text-xl font-semibold text-slate-700">Subsection Title</h3>

<!-- Card Titles -->
<h4 class="text-lg font-semibold text-slate-800">Card Title</h4>
```

#### Body Text
```html
<!-- Primary text -->
<p class="text-base text-slate-800">Primary content text</p>

<!-- Secondary text -->
<p class="text-sm text-slate-600">Secondary descriptive text</p>

<!-- Labels -->
<label class="text-sm font-semibold text-slate-700">Form Label</label>

<!-- Captions -->
<span class="text-xs text-slate-500">Caption or metadata</span>
```

### Layout Patterns

#### Page Container
```html
<div class="min-h-screen bg-slate-50/50 p-4 sm:p-6">
  <!-- Page content -->
</div>
```

#### Card Layout
```html
<div class="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
  <!-- Optional gradient header -->
  <div class="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
  
  <div class="p-6 sm:p-8">
    <!-- Card content -->
  </div>
</div>
```

#### Grid Systems
```html
<!-- Form Grid (responsive) -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  <!-- Grid items -->
</div>

<!-- Two-column layout -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Columns -->
</div>
```

### Component Patterns

#### Buttons

##### Primary Button
```html
<p-button
  label="Primary Action"
  icon="pi pi-check"
  styleClass="!bg-gradient-to-r !from-blue-500 !to-indigo-600 !border-none !text-white !font-semibold !px-6 !py-3 !rounded-xl !shadow-lg hover:!shadow-xl hover:!scale-105 !transition-all !duration-200"
></p-button>
```

##### Secondary Button
```html
<p-button
  label="Secondary Action"
  icon="pi pi-times"
  styleClass="!bg-slate-100 !border-slate-200 !text-slate-700 !font-semibold !px-6 !py-3 !rounded-xl hover:!bg-slate-200 !transition-all !duration-200"
></p-button>
```

##### Danger Button
```html
<p-button
  label="Delete"
  icon="pi pi-trash"
  styleClass="!bg-red-500 !border-none !text-white !font-semibold !px-4 !py-2 !rounded-lg hover:!bg-red-600 !transition-all !duration-200"
></p-button>
```

#### Form Controls

##### Dropdown
```html
<p-dropdown
  [options]="options"
  placeholder="Select option"
  styleClass="w-full !border-slate-200 !rounded-lg hover:!border-blue-500 focus:!border-blue-500 focus:!shadow-lg"
></p-dropdown>
```

##### Calendar
```html
<p-calendar
  placeholder="Select date"
  styleClass="w-full !border-slate-200 !rounded-lg hover:!border-blue-500 focus:!border-blue-500"
></p-calendar>
```

##### Input Field
```html
<input
  pInputText
  placeholder="Enter text"
  class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
/>
```

#### Form Layout
```html
<div class="space-y-6">
  <div class="space-y-2">
    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <i class="pi pi-user text-blue-500"></i>
      Field Label
    </label>
    <p-dropdown
      [options]="options"
      placeholder="Select option"
      styleClass="w-full !border-slate-200 !rounded-lg"
    ></p-dropdown>
  </div>
</div>
```

#### Tables

##### Table Container
```html
<div class="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
  <p-table
    [value]="data"
    styleClass="!border-none"
    [tableStyle]="{'min-width': '50rem'}"
  >
    <!-- Table content -->
  </p-table>
</div>
```

##### Table Headers
```html
<ng-template pTemplate="header">
  <tr class="bg-slate-50">
    <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
      Header
    </th>
  </tr>
</ng-template>
```

##### Table Body
```html
<ng-template pTemplate="body" let-item>
  <tr class="hover:bg-slate-50 transition-colors duration-200">
    <td class="px-6 py-4 text-sm text-slate-800 border-b border-slate-100">
      {{item.field}}
    </td>
  </tr>
</ng-template>
```

#### Dialogs

##### Dialog Container
```html
<p-dialog
  header="Dialog Title"
  [(visible)]="showDialog"
  [modal]="true"
  [style]="{width: '90vw', maxWidth: '800px'}"
  styleClass="!rounded-2xl !shadow-2xl"
>
  <div class="space-y-6">
    <!-- Dialog content -->
  </div>
  
  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-4 pt-6 border-t border-slate-200">
      <!-- Footer buttons -->
    </div>
  </ng-template>
</p-dialog>
```

#### Loading States
```html
<!-- Loading Spinner -->
<div class="flex flex-col items-center justify-center py-16 space-y-4">
  <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
  <p class="text-slate-600 text-lg">Loading...</p>
</div>

<!-- Skeleton Loader -->
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-slate-200 rounded w-3/4"></div>
  <div class="h-4 bg-slate-200 rounded w-1/2"></div>
</div>
```

#### Empty States
```html
<div class="flex flex-col items-center justify-center py-16 space-y-4">
  <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
    <i class="pi pi-inbox text-2xl text-slate-400"></i>
  </div>
  <h3 class="text-xl font-semibold text-slate-800">No Data Found</h3>
  <p class="text-slate-600 text-center max-w-md">
    There are no items to display at the moment.
  </p>
</div>
```

### Responsive Design

#### Breakpoints
- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)

#### Responsive Patterns
```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

<!-- Responsive text -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl">

<!-- Responsive padding -->
<div class="p-4 sm:p-6 lg:p-8">

<!-- Responsive flex direction -->
<div class="flex flex-col lg:flex-row gap-4">
```

### Animation Guidelines

#### Transitions
```css
/* Standard transition for interactive elements */
.transition-all.duration-200

/* Hover scale effect for buttons */
.hover:scale-105.transition-transform.duration-200

/* Shadow transitions */
.hover:shadow-xl.transition-shadow.duration-200
```

#### Loading Animations
```html
<!-- Spin animation -->
<i class="pi pi-spin pi-spinner"></i>

<!-- Pulse animation -->
<div class="animate-pulse bg-slate-200"></div>
```

### Accessibility

#### Focus States
- All interactive elements should have visible focus states
- Use `focus:ring-2 focus:ring-blue-500/20` for custom focus styles
- Ensure color contrast meets WCAG AA standards

#### ARIA Labels
```html
<button aria-label="Close dialog">
  <i class="pi pi-times"></i>
</button>
```

### PrimeNG Customization

#### CSS Overrides (in component CSS files)
```css
:host ::ng-deep {
  /* Dialog styling */
  .p-dialog .p-dialog-header {
    border-bottom: 1px solid rgb(226 232 240);
    background: white;
    border-radius: 1rem 1rem 0 0;
  }

  /* Table hover effects */
  .p-datatable .p-datatable-tbody > tr:hover {
    background: rgb(248 250 252) !important;
  }

  /* Focus states */
  .p-dropdown:not(.p-disabled).p-focus {
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.2) !important;
    border-color: rgb(59 130 246) !important;
  }
}
```

### Icon Usage

#### Standard Icons
- **Actions**: `pi-plus`, `pi-pencil`, `pi-trash`, `pi-save`
- **Navigation**: `pi-arrow-left`, `pi-arrow-right`, `pi-home`
- **Status**: `pi-check`, `pi-times`, `pi-exclamation-triangle`
- **Content**: `pi-calendar`, `pi-video`, `pi-map-marker`, `pi-user`

#### Icon Patterns
```html
<!-- Icon with text -->
<div class="flex items-center gap-2">
  <i class="pi pi-calendar text-blue-500"></i>
  <span>Schedule</span>
</div>

<!-- Icon button -->
<button class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
  <i class="pi pi-plus text-white"></i>
</button>
```

### Best Practices

#### Do's
- Use consistent spacing (multiples of 4: 4, 8, 12, 16, 24, 32)
- Maintain consistent border radius (lg: 0.5rem, xl: 0.75rem, 2xl: 1rem)
- Use semantic color names (blue-500 instead of #3b82f6)
- Implement responsive design from mobile-first
- Use Tailwind utilities over custom CSS
- Group related styles together
- Use meaningful component and class names

#### Don'ts
- Don't use arbitrary values unless absolutely necessary
- Don't mix custom CSS with Tailwind utilities
- Don't use inline styles
- Don't ignore accessibility considerations
- Don't use fixed dimensions for responsive elements
- Don't override PrimeNG styles unless necessary

### File Organization

#### Component Structure
```
component-name/
├── component-name.component.html    # Tailwind classes only
├── component-name.component.css     # Minimal PrimeNG overrides only
├── component-name.component.ts      # TypeScript logic
└── component-name.component.spec.ts # Tests
```

#### CSS File Guidelines
- Keep CSS files minimal (only PrimeNG overrides)
- Use `:host ::ng-deep` for PrimeNG customizations
- Document why each override is necessary
- Prefer Tailwind utilities in HTML over custom CSS

This guideline ensures consistent, maintainable, and scalable styling across the entire Movie Booking App while leveraging the power of Tailwind CSS and PrimeNG components.
