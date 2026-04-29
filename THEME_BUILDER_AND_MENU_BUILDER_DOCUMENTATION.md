# Theme Builder and Menu Builder
## Complete Functional Documentation

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Theme Builder and Menu Builder: Complete Functional Documentation |
| **Project Name** | iDMS-UI (Intelligent Document Management System - User Interface) |
| **Document Version** | 1.0 |
| **Prepared For** | Business Users, Product Owners, QA Testers, Support Teams, Implementation Teams, Project Stakeholders |
| **Prepared By** | Documentation Team |
| **Date** | April 2026 |
| **Status** | Draft |

---

## Document Purpose

This document provides a comprehensive, business-friendly explanation of two key features in the iDMS-UI application:

1. **Theme Builder** - A tool for creating, configuring, and publishing visual themes that control the application's colors, fonts, logos, and overall brand appearance.

2. **Menu Builder** - A tool for organizing, arranging, and publishing the navigation menu structure that users see in the application sidebar.

### Who Should Read This Document?

- **Business Users** who need to create and manage themes or navigation menus
- **Product Owners** who need to understand feature capabilities and business logic
- **QA Testers** who need to test theme and menu functionality
- **Support Teams** who need to help users understand these features
- **Implementation Teams** who need to configure the features during deployment
- **Project Stakeholders** who need a high-level overview of these capabilities

### What This Document Explains

- What each feature does and why it exists
- How users interact with each feature
- What screens and dialogs users see
- What each button and control does
- How draft, preview, reset, and publish actions work
- What happens when changes are made
- Which reusable components are involved in each feature
- Which project files are related to each feature

---

## Feature Summary

| Feature | Purpose | Main Users | Main Actions | Output |
|---------|---------|-----------|--------------|---------|
| **Theme Builder** | Create and manage reusable visual themes with colors, fonts, logos, and brand styling. Publish themes to make them available in the header theme dropdown. | Administrators, Brand Managers, UI Designers | Create, Edit, Preview, Save as Draft, Publish, Deactivate | Published themes appear in the header dropdown for all users to select |
| **Menu Builder** | Create and organize navigation menu structure with sections, groups, and menu items. Publish changes to update the live sidebar navigation. | Administrators, Product Managers, Content Managers | Create Sections, Add Groups, Add Items, Drag-and-Drop, Reset, Save as Draft, Publish | Navigation sidebar updates with new menu structure and organization |

---

# SECTION 1: THEME BUILDER

---

## 1.1 Theme Builder Purpose

### What Is It?

The Theme Builder is a feature that allows authorized users to create custom visual themes for the application. A **theme** is a complete set of styling rules including:

- **Colors** - Primary brand color, secondary colors, background colors, text colors, status indicator colors
- **Typography** - Font families, font sizes, font weights, line heights
- **Layout** - Border radius, button styles, card styling, spacing
- **Branding** - Company logo or brand image

### Why Does It Exist?

The Theme Builder solves these business problems:

- **Brand Consistency** - Ensures the application reflects the organization's brand identity
- **Multi-Tenant Support** - Different organizations can have different branded experiences
- **User Preference** - Users can switch between themes from a dropdown without affecting core functionality
- **Non-Technical Theme Management** - Business users can create themes without programming knowledge
- **Draft Before Publishing** - Changes can be tested before making them visible to users

### How Do Users Benefit?

- **Administrators** can create branded experiences without involving developers
- **Users** can switch between themes based on preference
- **Organizations** can maintain visual consistency across all business applications
- **Designers** can rapidly test color and typography variations
- **Teams** can collaborate on theme design and approval workflows

---

## 1.2 Theme Builder Entry Point

### Where to Access Theme Builder?

**Navigation Path:**
1. Click the user profile icon (top right of application)
2. Select "Business Settings" or "Profile" menu
3. Click "Theme Builder"

**First Screen User Sees:**
The Theme Builder List View showing all existing themes, with options to create new themes or edit existing ones.

**Required Permission:**
Administrator or Business Settings Editor role. (Needs confirmation from project team regarding exact role names and permissions.)

**Related Files:**
- [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx)
- [src/theme/customThemeBuilder.ts](src/theme/customThemeBuilder.ts)
- [src/theme/themeRegistry.ts](src/theme/themeRegistry.ts)

---

## 1.3 Theme Builder List View

### What the User Sees

The list view displays all themes (both built-in system themes and custom user-created themes) in a table format.

| Column | Content | Purpose |
|--------|---------|---------|
| **Theme Name** | Name of the theme (e.g., "Excellon Blue", "Midnight Dark") | Identifies the theme for selection and management |
| **Status Badge** | Colored badge showing: Active, Published, Draft, or Inactive | Shows if theme is live, pending, or inactive |
| **Description** | Short description of the theme or brand use case | Helps users understand the theme's purpose |
| **Logo Preview** | Small thumbnail of the brand logo, or initials if no logo | Quick visual identification of the theme |
| **Created Date** | Date the theme was created | Tracks creation history |
| **Updated Date** | Date the theme was last modified | Shows when theme was last changed |
| **Actions Menu** | Buttons: Preview, Edit, Publish, Deactivate (context-dependent) | Provides access to theme operations |

### Theme Status Explanation

| Status Badge | What It Means | Visible in Header Dropdown? | What Users See |
|-------------|---------------|---------------------------|-----------------|
| **Active** | Published and currently selected as the default theme | Yes | Selected in the theme dropdown |
| **Published** | Approved and available for selection by users | Yes | Available in the theme dropdown |
| **Draft** | Saved but not yet published; only visible in Theme Builder | No | Hidden from all users; only in Theme Builder |
| **Inactive** (Deactivated) | Published before but deliberately turned off; no longer available | No | Users cannot select; older selection remains if already chosen |

### Available Actions in List View

| Action | What It Does | When to Use It |
|--------|-------------|---------------|
| **New Theme Button** | Opens theme creation form | When building a brand new theme from scratch |
| **Preview** | Opens a preview of how the theme will look | To visually inspect theme before publishing |
| **Edit** | Opens the theme form for modifications | To change colors, fonts, logo, or description |
| **Publish** | Makes theme available in the header dropdown | When theme is ready for users to select |
| **Deactivate** | Hides theme from the dropdown; keeps it in Theme Builder | When theme should no longer be available to users |
| **Duplicate** | Creates a copy of the theme as a new draft | To quickly create a similar theme as starting point |

**Related Files:**
- [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx)

---

## 1.4 Theme Status Badges

### How Status Badges Work

Each theme in the list view displays a colored badge that shows its current state:

| Badge Color | Status | Meaning |
|------------|--------|---------|
| Green | Active | This is the theme currently being used; published and selected |
| Blue/Pending | Published | Available for selection but not currently active |
| Gray/Draft | Draft | Unsaved or in-progress; not visible to users |
| Red/Inactive | Inactive | Deactivated and no longer available for selection |

### Using Status Information

- **Draft themes** should be treated as work-in-progress. They don't affect any users.
- **Published themes** are available for users to choose in the header dropdown.
- **Active theme** is the one currently applied across the application.
- **Inactive themes** remain in the system for historical reference but cannot be selected.

---

## 1.5 Create New Theme Flow

### Step-by-Step Process

**Step 1: Click "New Theme" Button**
- User is on Theme Builder list page
- Clicks the "New Theme" button (usually in top-right area)

**Step 2: Theme Creation Form Opens**
- A form dialog or new page opens with blank fields
- Default values are populated (e.g., standard brand colors)

**Step 3: Enter Basic Details**
- User enters theme name (e.g., "Holiday Season Orange")
- User enters short label (2-4 characters used in logo area, e.g., "HSO")
- User enters optional description (e.g., "Warm orange theme for seasonal campaigns")

**Step 4: Configure Colors**
- User selects primary, secondary, accent colors
- User sets background and text colors
- User configures status colors (error, warning, success)

**Step 5: Configure Typography**
- User selects body font family
- User selects heading font family
- User sets base font size, weight, line height

**Step 6: Upload Logo**
- User uploads brand logo (PNG, JPG, SVG, or WebP)
- Logo preview displays in real-time

**Step 7: Configure Layout**
- User sets border radius values for cards, buttons, inputs
- User selects shadow style (soft, medium, strong)

**Step 8: Preview Theme**
- User clicks "Preview" button
- Live preview shows how theme will appear across the app
- User can see: header, sidebar, cards, buttons, text, colors in action

**Step 9: Save or Publish**
- **Save as Draft**: Theme is saved but hidden from users (status = Draft)
- **Publish**: Theme is saved and made available in header dropdown (status = Published)

### Form Validation

Before saving or publishing, the system validates:

| Requirement | Error Message | Resolution |
|------------|-----------------|-----------|
| Theme name is empty | "Theme name is required." | Enter a unique theme name |
| Theme name already exists | "Theme name must be unique." | Choose a different name |
| Color is invalid hex value | "Use a valid HEX color." (e.g., #FF5733) | Re-enter valid 6-digit hex color |
| All required fields for publish | "Short label is required before publishing." | Add 2-4 character short label |

**Related Files:**
- [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx)
- [src/theme/customThemeBuilder.ts](src/theme/customThemeBuilder.ts)

---

## 1.6 Theme Form Layout and Sections

### Overall Form Structure

The theme form is divided into logical sections that guide the user through creating a complete theme:

| Section | Fields | Purpose | Visual Layout |
|---------|--------|---------|----------------|
| **Basic Details** | Theme name, Short label, Description | Identify and describe the theme | Top section, main form area |
| **Brand Logo** | Logo upload with preview, File constraints | Add visual branding | Card or panel with logo preview |
| **Colors** | 16 color fields with pickers and hex inputs | Set all application colors | Grid of color swatches and inputs |
| **Typography** | Font families, sizes, weights, line heights | Configure text appearance | Form grid with dropdowns and inputs |
| **Layout** | Border radius, button styles, spacing, shadows | Set component styling | Settings grid with numeric inputs |
| **Preview** | Live preview of the theme | See how theme will appear | Side panel or below form (desktop) or tab (mobile) |
| **Actions** | Save Draft, Preview, Publish, Cancel buttons | Control workflow | Footer or top-right action bar |

### Basic Details Section

**Fields:**

| Field | Type | Required? | Constraints | Helper Text |
|-------|------|-----------|-----------|------------|
| **Theme Name** | Text input | Yes | Max 100 characters, must be unique | Name of your theme (e.g., "Ocean Blue", "Forest Green") |
| **Short Label** | Text input | Yes (for publish) | 2-4 uppercase letters | Used in logo area when no logo uploaded |
| **Description** | Text area | No | Max 500 characters | Optional description of the theme's purpose or audience |

### Color Configuration Section

**How Color Selection Works:**

For each of 16 color fields (Primary, Secondary, Accent, Background, Surface, Text Primary, Text Secondary, Border, Error, Warning, Success, Info, Header Background, Sidebar Background, Button Background, Link):

1. **Color Swatch** - Visual preview of selected color
2. **Color Picker** - Click to open HTML5 color picker
3. **Hex Value Input** - Manual entry of hex code (e.g., #FF5733)
4. **Helper Text** - Explains what the color is used for

| Color Field | Purpose | Example Usage | Visible Where |
|-------------|---------|-------------|---|
| **Primary** | Main brand and selected action color | Active buttons, selected menu items | Buttons, links, selections |
| **Secondary** | Secondary actions and accents | Secondary buttons, supporting UI | Forms, secondary actions |
| **Accent** | Highlights and insights | Badges, alert accents | Data highlights, special elements |
| **Background** | Page background | Page base color | Entire page background |
| **Surface** | Cards and panels | Card backgrounds, modals | Cards, dialogs, elevated areas |
| **Text Primary** | Main readable text | Body text, headings | All primary text content |
| **Text Secondary** | Muted text | Helper text, metadata | Secondary information, hints |
| **Border** | Borders for inputs and tables | Line color | Input borders, table lines |
| **Error** | Error states | Error messages, invalid inputs | Validation errors, alerts |
| **Warning** | Warning states | Warning messages, caution UI | Warnings, pending actions |
| **Success** | Success states | Success messages, checkmarks | Confirmations, completed states |
| **Info** | Informational states | Info messages, links | Information, links |
| **Header Background** | Top navigation color | Header bar background | Application header |
| **Sidebar Background** | Navigation menu color | Sidebar/menu background | Left navigation sidebar |
| **Button Background** | Primary button color | Button fill color | Primary action buttons |
| **Link** | Hyperlink color | Link text color | All clickable links |

**Color Validation:**

- User enters or selects a HEX color (e.g., #FF5733)
- System validates format (must be #RRGGBB or #RGB)
- If invalid, error message appears: "Use a valid HEX color."
- User corrects and re-submits

### Typography Configuration Section

| Field | Type | Options | Purpose |
|-------|------|---------|---------|
| **Body Font** | Dropdown | Noto Sans, Arial, Inter, Georgia, Verdana | Main text throughout app |
| **Heading Font** | Dropdown | Noto Sans, Arial, Inter, Georgia, Verdana | Titles and headings |
| **Base Font Size** | Number input | 12-18 pixels | Default text size |
| **Font Weight** | Dropdown | Regular (400), Medium (500), Semibold (600), Bold (700) | Default text thickness |
| **Line Height** | Number input | 16-28 pixels | Vertical space between lines |
| **Button Text Style** | Dropdown | Sentence case, UPPERCASE | Text transformation for buttons |

**What These Do:**

- **Font Family** - Changes which typeface is used throughout the app
- **Font Size** - Makes text larger or smaller across the application
- **Font Weight** - Makes text appear bolder or lighter
- **Line Height** - Affects readability and spacing between lines
- **Button Case** - Controls how button text is displayed

### Layout Configuration Section

| Field | Type | Range | Purpose |
|-------|------|-------|---------|
| **Border Radius** | Number input | 0-24 px | Roundness of general elements |
| **Button Radius** | Number input | 0-24 px | Roundness of buttons specifically |
| **Card Radius** | Number input | 0-24 px | Roundness of cards and panels |
| **Input Radius** | Number input | 0-24 px | Roundness of input fields |
| **Spacing Scale** | Number input | 2-8 px | Base unit for spacing throughout app |
| **Shadow Style** | Dropdown | Soft, Medium, Strong | Depth effect on cards/dialogs |

**Design Impact:**

- **Border Radius = 0** = Sharp, modern, geometric look
- **Border Radius = 16-24** = Soft, friendly, rounded look
- **Shadow Style = Soft** = Subtle, minimal depth
- **Shadow Style = Strong** = Dramatic, prominent depth

### Preview Area

**Location:** 
- Desktop: Right side panel (1/3 width)
- Mobile: Below form (collapsed/expandable)

**What It Shows:**
- Sample header with logo and buttons
- Sample sidebar with menu items
- Sample card with text and buttons
- Sample color swatches
- Text styles demonstration

**Behavior:**
- Updates in real-time as user changes values
- Shows exactly how the theme will appear to end users
- Allows user to preview before committing changes
- Does NOT apply changes to live application

### Action Buttons

| Button | Color | Behavior | When to Use |
|--------|-------|----------|-----------|
| **Cancel** | Outline | Closes form, discards all changes | User changed mind or wants to abort |
| **Save Draft** | Outline | Saves theme with Draft status; hidden from users | User wants to work more later |
| **Preview** | Secondary | Opens full preview of theme | User wants to see full mockup before saving |
| **Publish** | Primary (enabled if valid) | Saves theme with Published status; appears in dropdown | User is ready to make theme available |

---

## 1.7 Theme Color Configuration in Detail

### How to Select Colors

**Method 1: Color Picker (Easiest)**
1. Click on the colored swatch next to color field name
2. HTML5 color picker opens
3. Click on color area to select shade
4. Brightness bar on right adjusts lightness
5. Selected color appears in real-time preview
6. Click outside to confirm selection

**Method 2: Hex Value Input (Precise)**
1. Click on the hex value input field (shows current color, e.g., #FF5733)
2. Clear the field
3. Enter hex code (6 digits + # symbol)
4. Press Tab or Enter
5. Color preview updates if valid
6. If invalid, error message appears

**Common Hex Colors Reference:**

| Color | Hex | Use Case |
|-------|-----|----------|
| Royal Blue | #1c1977 | Primary brand color |
| Indigo | #4f46e5 | Secondary actions |
| Teal | #0f766e | Accent and highlights |
| White | #ffffff | Surface/background |
| Light Gray | #f8fafc | Page background |
| Dark Gray | #1f2937 | Primary text |
| Medium Gray | #6b7280 | Secondary text |
| Red | #d14343 | Error states |
| Amber | #d97706 | Warning states |
| Green | #15803d | Success states |

### Invalid Color Handling

**Scenario:** User enters invalid hex value (e.g., "red", "#GGGGGG", "#FF573")

**System Response:**
1. Field shows error message: "Use a valid HEX color."
2. Color swatch does NOT update
3. Save/Publish button remains enabled (but validation prevents publication)
4. User must correct the value before publishing

### Color Preview Impact

**Where Users See These Colors:**

- **Primary color** → Button backgrounds, links, active states
- **Background color** → Page base color behind all content
- **Text colors** → All readable content
- **Border colors** → Input fields, table lines, card edges
- **Status colors** → Error messages (red), warnings (orange), success (green)

**Real-Time Preview:**
As user changes colors, the preview pane on the right updates immediately to show:
- Header with new background color
- Sidebar with new background
- Sample buttons with new button color
- Sample text with new text colors
- Color swatches showing all selected colors

---

## 1.8 Theme Typography Configuration in Detail

### Font Selection

**Available Fonts:**
- Noto Sans (recommended, clean, modern)
- Arial (standard, professional)
- Inter (designed for screens, geometric)
- Georgia (serif, traditional)
- Verdana (sans-serif, readable)

**Why Fonts Matter:**
- Different fonts create different brand impressions
- Font affects readability and user perception
- Consistent fonts across app improve professionalism

### Font Size and Weight

**Base Font Size (12-18 pixels):**
- 12px = Small, compact, dense information
- 14px = Standard, default, most common
- 16px = Larger, more readable, modern trend
- 18px = Extra large, accessible, youth-oriented

**Font Weight (400-700):**
- 400 (Regular) = Normal thickness
- 500 (Medium) = Slightly bolder
- 600 (Semibold) = Bolder
- 700 (Bold) = Very bold

**Line Height (16-28 pixels):**
- 16px = Tight spacing, compact
- 20px = Standard, comfortable reading
- 24px = Loose spacing, very readable
- 28px = Extra loose, document-style

### Button Text Transformation

| Option | Result | Example |
|--------|--------|---------|
| **Sentence case** | Text displays as entered | "Click here", "Submit form" |
| **UPPERCASE** | All text converted to capitals | "CLICK HERE", "SUBMIT FORM" |

---

## 1.9 Theme Logo/Branding Configuration

### Logo Upload

**What It Does:**
The logo appears in the top-left corner of the header and in the Theme Builder interface.

**How to Upload:**
1. Go to "Brand Logo" section
2. Click "Upload Logo" button
3. Select image file from computer
4. Logo preview updates immediately

**Supported Formats:**
- PNG (recommended)
- JPG/JPEG
- SVG (vector, scales perfectly)
- WebP (modern format)

**File Constraints:**
- Maximum size: 512 KB
- Dimensions: Any size (will be resized to fit)
- Recommended: Square format (e.g., 256x256 pixels) works best

**Validation:**

| Issue | Error Message | Solution |
|-------|---|----------|
| Wrong file type | "Logo must be a PNG, JPG, SVG, or WebP file." | Select a PNG, JPG, SVG, or WebP image |
| File too large | "Logo file must be 512 KB or smaller." | Compress the image or choose a smaller file |
| No file selected | (No error, field remains empty) | Click Upload and select a file |

### Logo Preview

**Where Logo Appears:**
- Theme Builder list view (small thumbnail)
- Theme builder form page
- Theme preview panel
- Header of application (if theme is published and selected)

**Fallback Behavior:**
If no logo is uploaded, the application displays the short label (2-4 letters) instead:
- Theme Name: "Ocean Blue" → Fallback: "OB"
- Theme Name: "Forest Green" → Fallback: "FG"

### Remove Logo

To remove an uploaded logo and revert to letter fallback:
1. Click "Remove" button next to logo preview
2. Logo preview returns to letter display
3. Logo is deleted from theme configuration

---

## 1.10 Theme Preview Functionality

### What Is Preview?

**Definition:** Preview is a temporary view of how the theme will look when applied to the entire application. It allows users to see colors, fonts, logos, and layouts in real context before publishing.

### How to Open Preview

**Method 1: From Theme Form**
1. User fills out theme details (or opens existing theme)
2. Clicks "Preview" button in action bar
3. Preview screen opens with full mockup

**Method 2: From List View**
1. User is on Theme Builder list
2. Clicks "Preview" next to a theme
3. Preview screen opens

### What Preview Shows

| Element | Purpose |
|---------|---------|
| **Header Bar** | Shows how header will look with new colors and logo |
| **Sidebar Navigation** | Sample menu with new background and text colors |
| **Sample Cards** | How cards and panels will appear with new styling |
| **Text Samples** | Body text, headings, and labels with new fonts |
| **Buttons** | Primary and secondary buttons with new colors |
| **Status Colors** | Error, warning, and success states with new colors |
| **Color Swatches** | Visual display of all configured colors |

### Important: Preview Does NOT Apply Changes

**Critical Distinction:**
- **Preview** = Temporary mockup only. Does NOT change the live application.
- **Publish** = Permanently applies theme to the application. Users can select it from dropdown.

**User Behavior:**
- User can safely click "Preview" without affecting anyone
- User can switch between themes in preview multiple times
- User must click "Publish" to make the theme available to others
- Closing preview returns to theme form without applying changes

### Desktop vs. Mobile Preview

Preview may show both desktop and mobile versions:
- **Desktop** = Full-width application interface
- **Mobile** = Mobile-responsive layout (if available)

---

## 1.11 Save as Draft

### What "Save as Draft" Does

**Definition:** Saves the current theme configuration with Draft status, but does NOT make it available to users.

### When to Use Save as Draft

| Scenario | Reason |
|----------|--------|
| Theme is incomplete | User wants to finish it later |
| Team needs to review | Draft saved for approval before publishing |
| Colors need adjustment | Save progress and get feedback before publishing |
| Testing different options | Save multiple drafts to compare approaches |

### Where Draft Themes Are Visible

| Location | Visible? | Who Sees It? |
|----------|----------|------------|
| Theme Builder list | Yes | Only user who created it and admins |
| Header theme dropdown | No | Not available to any user |
| Theme preview | Yes | Only in Theme Builder |

### After Saving as Draft

**What Happens:**
1. Theme is saved to local browser storage (localStorage)
2. Status badge changes to "Draft"
3. User receives confirmation message (if visible)
4. User can continue editing or navigate away

**Can User Change It Later?**
- Yes. User can edit a draft theme anytime
- Changes to draft do NOT affect live application
- User must click "Publish" to make it live

### Draft vs. Published Comparison

| Aspect | Draft | Published |
|--------|-------|-----------|
| Saved? | Yes | Yes |
| In Theme Builder? | Yes | Yes |
| In Header Dropdown? | No | Yes |
| Affects Users? | No | Yes |
| Can Edit? | Yes | Yes (creates unsaved changes) |
| Can Delete? | Yes | Yes (or deactivate) |

---

## 1.12 Publish Theme

### What "Publish" Does

**Definition:** Publishes the theme and makes it available in the header theme dropdown for all users to select.

### Before Publishing: Validation

The system checks that the theme is valid before allowing publication:

| Validation Rule | Error Message | Fix |
|-----------------|---|---|
| Theme name required | "Theme name is required." | Enter a theme name |
| Name is unique | "Theme name must be unique." | Choose a different name |
| All colors are valid hex | "Use a valid HEX color." (for each invalid color) | Correct hex values |
| Short label required | "Short label is required before publishing." | Add 2-4 letter short label |

**Important:** Publish button is disabled (grayed out) if any validation error exists.

### What Changes After Publishing

| Change | Impact |
|--------|--------|
| Status = Published | Theme appears in list as Published |
| In Header Dropdown | Theme now selectable by all users |
| Public Availability | Any user with access to header can choose this theme |
| Persisted to Storage | Theme saved to localStorage for persistence |

### User Experience After Publishing

1. **User navigates to header theme dropdown**
2. **Published theme appears in list** (e.g., "Ocean Blue", "Forest Green")
3. **User clicks theme name**
4. **Theme applies to entire application immediately**
5. **User sees all colors, fonts, logos, layout changes**

### Can User Unpublish?

- User can click "Deactivate" to remove theme from dropdown
- User can also edit a published theme (creates unsaved changes)
- User cannot delete published theme while in use

---

## 1.13 Deactivate Theme

### What "Deactivate" Does

**Definition:** Removes theme from the header dropdown, making it unavailable for selection. The theme remains in Theme Builder for historical reference.

### When to Use Deactivate

| Scenario | Reason |
|----------|--------|
| Theme is outdated | Old seasonal theme no longer needed |
| Brand rebranding | Old brand colors replaced with new |
| Theme has issues | Theme with technical problems removed from circulation |
| Cleanup | Remove unused themes but keep them in history |

### Confirmation Dialog

Before deactivating, system shows confirmation:
- **Title:** "Deactivate this theme?"
- **Message:** "The theme will no longer appear in the theme dropdown. Users who have selected this theme will keep using it until they manually switch."
- **Buttons:** Cancel, Deactivate

### After Deactivation

| Aspect | Result |
|--------|--------|
| Status Badge | Changes to "Inactive" |
| In Header Dropdown? | No, removed from user view |
| In Theme Builder? | Yes, still visible to admins |
| Users' Selection | If a user has this theme selected, it continues working but cannot switch back |
| Can Reactivate? | Yes, re-publish to make available again |

### Important Behavior

**If User Had Theme Selected:**
- Theme continues to work
- User keeps seeing the deactivated theme's colors/styling
- User cannot reselect it from dropdown if they switch to another theme
- Admin should notify users of the change

---

## 1.14 Header Theme Dropdown Integration

### Where Does Theme Dropdown Appear?

**Location:** Top-right corner of application header

**Component:** ThemeSwitcher component in AppTopHeader

### What Appears in Dropdown

**Only Published Themes Appear:**

| Theme Status | Visible in Dropdown? | Reason |
|-------------|---|---------|
| Published and Active | Yes | Currently selected theme highlighted |
| Published (not active) | Yes | Available for user to select |
| Draft | No | Not yet approved or ready |
| Deactivated | No | Removed from circulation |

### How Published Themes Become Available

**Publication Flow:**

1. **Admin creates theme in Theme Builder**
2. **Admin clicks "Publish"**
3. **System validates theme**
4. **If valid, status = Published**
5. **Theme is added to localStorage with published flag**
6. **Next time app loads or theme list refreshes, new theme appears in dropdown**
7. **Users see it in header dropdown immediately**

### User Theme Selection Workflow

1. **User sees header dropdown** (showing all published themes)
2. **User clicks theme name** (e.g., "Ocean Blue")
3. **Theme applies instantly** to entire application
4. **All colors, fonts, logos change immediately**
5. **Selection is saved to localStorage** (persists on reload)

---

## 1.15 Theme Builder States and Validation

### Empty State

**When It Appears:**
- User first opens Theme Builder
- No themes have been created yet (unlikely in production)
- All themes have been deleted

**What User Sees:**
- Message: "No themes yet. Create your first theme."
- Large "New Theme" button
- Explanation of what themes are

### Loading State

**When It Appears:**
- Theme Builder is fetching theme data from storage
- Initial page load (very brief)

**What User Sees:**
- Spinner/loading indicator
- Message: "Loading themes..."
- Page is not interactive until loaded

### Empty Theme Form State

**When User Creates New Theme:**
- Form opens with default/empty values
- All color fields show default brand colors
- Typography fields show default fonts
- No logo uploaded

### Validation Error State

**When It Appears:**
- User tries to save/publish with invalid data
- User enters invalid color code
- User leaves required fields empty
- User enters duplicate theme name

**What User Sees:**
- Error message appears above invalid field
- Error text is red or warning color
- Invalid field is highlighted
- Save/Publish button may be disabled

| Validation Error | Message | Where It Shows |
|------------------|---------|---|
| Empty theme name | "Theme name is required." | Next to name field |
| Duplicate name | "Theme name must be unique." | Next to name field |
| Invalid color | "Use a valid HEX color." | Next to color field |
| Missing short label | "Short label is required before publishing." | Next to label field |

### Success State

**After Successful Save/Publish:**
- Form closes or resets
- List view shows updated theme
- Confirmation message appears (toast/snackbar)
- User is returned to theme list

**Message Examples:**
- "Theme saved as draft successfully"
- "Theme published successfully"
- "Theme deactivated"

---

# SECTION 2: MENU BUILDER

---

## 2.1 Menu Builder Purpose

### What Is It?

The Menu Builder is a feature that allows authorized users to create, organize, and publish the navigation menu structure that appears in the application sidebar. The menu is hierarchical, with three levels:

- **Level 1 (Sections)** - Main categories like "Procurement", "Sales", "Administration"
- **Level 2 (Groups)** - Sub-groupings like "Purchase Orders", "Invoices"
- **Level 3 (Items)** - Actual menu items linking to pages

### Why Does It Exist?

The Menu Builder solves these business problems:

- **Flexible Navigation** - Administrators can reorganize menu without code changes
- **Role-Based Visibility** - Show/hide menu items based on user roles (needs confirmation)
- **Drag-and-Drop Simplicity** - Business users can rearrange menus without technical skills
- **Multi-Organization Support** - Different organizations can have different menu structures
- **Draft Before Publishing** - Test changes before making them live to users

### How Do Users Benefit?

- **Administrators** can quickly reorganize navigation based on changing business needs
- **Users** see a relevant, organized menu structure
- **Product Managers** can test different navigation strategies
- **Organizations** can customize the menu without rebuilding the application

---

## 2.2 Menu Builder Entry Point

### Where to Access Menu Builder?

**Navigation Path:**
1. Click the user profile icon (top right)
2. Select "Business Settings" or "Profile"
3. Click "Menu Builder" or "Navigation Menu Builder"

**First Screen User Sees:**
The Menu Builder main page with a structure editor on the left and live preview on the right.

**Required Permission:**
Administrator or Navigation Editor role. (Needs confirmation from project team regarding exact role names and permissions.)

**Related Files:**
- [src/pages/profile/MenuBuilder.tsx](src/pages/profile/MenuBuilder.tsx)
- [src/components/common/MenuBuilder/MenuBuilderPage.tsx](src/components/common/MenuBuilder/MenuBuilderPage.tsx)
- [src/theme/MenuBuilderContext.tsx](src/theme/MenuBuilderContext.tsx)
- [src/utils/menuBuilderTypes.ts](src/utils/menuBuilderTypes.ts)
- [src/utils/menuBuilderUtils.ts](src/utils/menuBuilderUtils.ts)

---

## 2.3 Menu Builder Main Screen Layout

### Overall Layout

The Menu Builder page uses a two-column layout (desktop) or stacked layout (mobile):

| Area | Content | Width |
|------|---------|-------|
| **Left Column** | Structure Editor with menu hierarchy tree | 2/3 (desktop) or 100% (mobile) |
| **Right Column** | Live Menu Preview showing final menu | 1/3 (desktop) or 100% (mobile) |

### Top Header Section

**What's Displayed:**

| Element | Purpose |
|---------|---------|
| **Page Title** | "Navigation Menu Builder" |
| **Subtitle** | "Create sections, rearrange groups, assign routes, and publish a live navigation experience..." |
| **Back Button** | Return to previous page |
| **Status Badge** | Shows "Draft" or "Published" status |
| **Metrics Box** | Displays: Sections count, Groups count, Items count, Status (Ready/Review) |
| **Action Buttons** | Reset, Save Draft, Publish buttons |
| **Success Message** | Appears after actions (temporarily) |

### Structure Editor Section

**Purpose:** This is where the administrator builds and organizes the menu.

**Contains:**

| Element | Purpose |
|---------|---------|
| **Section Header** | "Structure Editor" |
| **Add Section Button** | Creates new top-level section |
| **Menu Tree** | Hierarchical display of sections, groups, items |
| **Drag Handles** | Allow repositioning elements |
| **Action Buttons** | Edit, Delete, Add Child buttons |
| **Expand/Collapse** | Show/hide child elements |

### Live Preview Section

**Purpose:** Shows how the menu will look to end users.

**Contains:**

| Element | Purpose |
|---------|---------|
| **Preview Header** | "Menu Preview" with Desktop/Mobile toggle |
| **Section Names** | Displayed as expandable buttons |
| **Groups** | Shown under sections when expanded |
| **Menu Items** | Displayed under groups |
| **Icons** | Small icons next to menu items if configured |
| **Links** | Items show route or URL label |

### Bottom Metrics Display

The page shows real-time counts:

| Metric | Shows |
|--------|-------|
| **Sections** | Total number of Level 1 sections |
| **Groups** | Total number of Level 2 groups across all sections |
| **Items** | Total number of Level 3 items across all groups |
| **Status** | "Ready" (if valid) or "Review" (if errors) |

**Related Files:**
- [src/components/common/MenuBuilder/MenuBuilderPage.tsx](src/components/common/MenuBuilder/MenuBuilderPage.tsx)
- [src/components/common/MenuBuilder/MenuTree.tsx](src/components/common/MenuBuilder/MenuTree.tsx)
- [src/components/common/MenuBuilder/MenuPreview.tsx](src/components/common/MenuBuilder/MenuPreview.tsx)

---

## 2.4 Menu Hierarchy Explanation

### Understanding Menu Levels

The application menu has three levels of organization:

**Level 1: Sections (Top-Level)**
- Examples: "Procurement", "Sales", "Administration", "Reporting"
- User sees them as main menu categories
- Can be expanded/collapsed
- Each has an icon
- Typically 4-8 sections

**Level 2: Groups (Sub-Categories)**
- Examples: Under "Procurement": "Purchase Orders", "Purchase Invoices", "Purchase Receipts"
- Appear as sub-menus under sections
- Can be labeled or hidden (shows only children)
- Groups items into logical categories
- Typically 2-5 groups per section

**Level 3: Items (Menu Links)**
- Examples: Under "Purchase Orders" → "Create Order", "View Orders", "Approve Orders"
- Actual clickable links to pages
- Each item has a route or external URL
- Optional icons
- Typically 3-8 items per group

### Hierarchy Example

```
Procurement (Section)
├── Purchase Orders (Group)
│   ├── Create Order (Item)
│   ├── View Orders (Item)
│   └── Approve Orders (Item)
├── Purchase Invoices (Group)
│   ├── Create Invoice (Item)
│   ├── View Invoices (Item)
│   └── Match Invoices (Item)
└── Settings (Group)
    └── Document Settings (Item)

Sales (Section)
├── Sales Orders (Group)
│   ├── Create Order (Item)
│   └── View Orders (Item)
└── Sales Invoices (Group)
    ├── Create Invoice (Item)
    └── View Invoices (Item)
```

### Why Hierarchy Matters

| Level | Purpose | Benefit |
|-------|---------|---------|
| **Sections** | Organize by business area | Users find related functions grouped together |
| **Groups** | Sub-categorize within section | Reduces cognitive load with expandable menus |
| **Items** | Direct access to features | Clear navigation paths to specific pages |

---

## 2.5 Create Menu Section Flow

### What Is a Section?

A **section** is the top-level menu category. It appears as a main menu button that users can expand to see sub-menus.

Examples: "Procurement", "Sales", "Administration", "Dashboards"

### Step-by-Step: Creating a Section

**Step 1: Click "Add Section" Button**
- User is on Menu Builder page
- Clicks the "Add Section" button (top-right of Structure Editor)

**Step 2: Create Section Dialog Opens**
- A form dialog appears
- Title: "Add Section"
- Form fields are empty or have defaults

**Step 3: Enter Section Details**

| Field | Required? | What to Enter | Constraints |
|-------|-----------|---|---|
| **Section Name** | Yes | Name of the section (e.g., "Procurement") | Max 100 characters; readable name |
| **Description** | No | Optional explanation (e.g., "All purchase-related operations") | Max 500 characters |
| **Icon** | No | Choose an icon to display next to section name | Dropdown of available icons |
| **Visibility** | No | Toggle to show/hide this section from users | Checkbox; default = Visible |

**Step 4: Save Section**
- User clicks "Create" or "Save" button
- System validates the section name is not empty
- If valid, section is added to the menu tree
- If invalid, error message appears

**Step 5: Section Appears in Tree**
- New section appears in Structure Editor
- Initially expanded showing "No groups"
- User can now add groups under this section

### Form Validation for Sections

| Requirement | Error Message | Fix |
|-------------|---|---|
| Section name is empty | "Section name is required" | Enter a section name |
| Name already exists | "This section name already exists" | Choose a unique name |

**Related Files:**
- [src/components/common/MenuBuilder/MenuFormDialog.tsx](src/components/common/MenuBuilder/MenuFormDialog.tsx)
- [src/utils/menuBuilderUtils.ts](src/utils/menuBuilderUtils.ts)

---

## 2.6 Parent Level Selection

### What Is a Parent Level?

In the menu hierarchy, a **parent** is the level above:

- **Section** has no parent (it's the top level)
- **Group** has a Section as parent
- **Item** has a Group as parent

### When User Selects Parent

**Creating a Group:**
1. User clicks "Add Group" under a Section
2. Form dialog opens with parent section pre-selected
3. User can see "Parent Section: Procurement" (example)
4. User cannot change the parent in this quick workflow

**Creating an Item:**
1. User clicks "Add Item" under a Group
2. Form shows "Parent Group: Purchase Orders"
3. User can select a different parent group if desired

### Changing Parent (Moving)

**Scenario:** User created an item in the wrong group and wants to move it

**How to Move:**
1. User can edit the item and change the parent group
2. Or user can use drag-and-drop (see section 2.8)
3. Moving is handled by reordering logic

### Preventing Invalid Relationships

**Circular Nesting Prevention:**
The system prevents invalid hierarchies like:
- Item being placed as parent of a Section (invalid)
- Section being moved under a Group (invalid)
- Circular reference: Group A → Item in Group B → Group B moved under Group A (invalid)

**Validation Rule:** An item can only have a Group as parent, a Group can only have a Section as parent.

**Needs Confirmation from Project Team:** Exact implementation of circular reference prevention.

---

## 2.7 Menu Item Management

### What Is a Menu Item?

A **menu item** is a single clickable link in the navigation menu. It represents:
- A page or feature in the application
- An internal route (e.g., "/purchase-orders")
- An external link (e.g., "https://help.example.com")

### Adding Menu Items

**Flow:**
1. User navigates to the Group where item should appear
2. Clicks "Add Item" button
3. Form dialog opens

**Form Fields:**

| Field | Required? | Purpose | Example |
|-------|-----------|---------|---------|
| **Item Label** | Yes | Name shown in menu to users | "Create Order" |
| **Item Key** | Yes | Unique identifier for routing | "create-order" |
| **Description** | No | Optional explanation | "Create a new purchase order" |
| **Route** | No | Internal application route | "/purchase-order/create" |
| **External URL** | No | External link (if not a route) | "https://help.example.com" |
| **Open in New Tab** | No | Whether to open URL in new tab | Checkbox |
| **Icon** | No | Icon to display next to item | Dropdown of icons |
| **Visibility** | No | Show/hide from users | Checkbox; default = Visible |

### Item Key Auto-Generation

When user enters an item label (e.g., "Create Purchase Order"):
- System auto-generates a **key** by:
  - Converting to lowercase
  - Replacing spaces with hyphens
  - Removing special characters
  - Example: "Create Purchase Order" → "create-purchase-order"

User can manually edit the key if desired.

### Editing Menu Items

**How to Edit:**
1. User clicks "Edit" button next to item in tree
2. Form dialog opens with current values
3. User modifies fields as needed
4. User clicks "Save" button
5. Changes apply immediately

### Moving Menu Items

**Via Edit Dialog:**
1. User opens "Edit Item" form
2. Changes "Parent Group" dropdown
3. Clicks "Save"
4. Item moves to new group

**Via Drag-and-Drop:** (See section 2.8)

### Removing Menu Items

**How to Delete:**
1. User clicks "Delete" or "Remove" button next to item
2. Item is immediately removed
3. No confirmation dialog (quick action)
4. User can undo by pressing Ctrl+Z (if implemented)

**Needs Confirmation:** Whether delete shows confirmation dialog or is immediate.

### Item Visibility Control

**What "Hide Item" Does:**
- Item remains in structure for editors to see
- Item does NOT appear in the live menu for end users
- Useful for hiding experimental features without removing them

**Use Cases:**
- Beta features being tested
- Features disabled for maintenance
- Seasonal features temporarily hidden

---

## 2.8 Drag-and-Drop Menu Editing

### What Is Drag-and-Drop?

**Drag-and-Drop** is a visual way to reorganize menu items by clicking and dragging them to new positions.

### How Drag-and-Drop Works

**Basic Flow:**

1. **Start Drag:** User clicks and holds on a menu item (section, group, or item)
2. **Move:** User drags the item while holding mouse button
3. **Hover Over Target:** User moves to where they want to place item
4. **Visual Feedback:** Target area highlights or shows insertion point
5. **Drop:** User releases mouse button
6. **Item Moves:** Item is moved to new location; tree reorders automatically

### Supported Drag Scenarios

| Moving | To | Result | Allowed? |
|--------|----|----|---|
| **Section** | Another section position | Sections reorder | Yes |
| **Group** | Different section | Group moves to new section | Yes |
| **Group** | Different position in same section | Groups reorder | Yes |
| **Item** | Different group | Item moves to new group | Yes |
| **Item** | Different position in same group | Items reorder | Yes |

### Not Allowed Scenarios

| Scenario | Why Not | Alternative |
|----------|--------|------------|
| Item onto item | Creates invalid hierarchy | Drop on group instead |
| Group directly onto item | Group can't be child of item | Edit and change parent |
| Circular references | Would break menu structure | System prevents automatically |

### Visual Indicators During Drag

**What User Sees:**

| Element | Appearance | Meaning |
|---------|-----------|---------|
| **Drag Handle** | Three horizontal lines icon | Shows item is draggable |
| **Item While Dragging** | Semi-transparent/grayed | Item is being moved |
| **Drop Target** | Blue highlight/border | Valid place to drop |
| **Invalid Target** | Red border/X icon | Cannot drop here |
| **Drop Zone** | Blue dashed area | Drop here to place |

### Preview Updates

**Real-Time Updates:**
- As user drags items, the menu structure updates in real-time
- Live preview on the right updates immediately
- User can see exact result before releasing

### Reordering Items

**Reordering Within Same Group:**
1. User drags item up or down
2. Other items shift to make space
3. Item settles in new position
4. Order is immediately saved to draft

**Reordering Sections:**
1. User drags section to new position in list
2. All child groups and items move with it
3. Other sections reorder around it

---

## 2.9 Live Menu Preview

### What Is the Preview?

The **Live Menu Preview** shows how the final menu will appear to end users. It updates in real-time as the administrator makes changes.

**Key Principle:** Preview is read-only. It shows what users will see, not an editable interface.

### Preview Display

**Desktop View:**
- Shows full sidebar as it appears to users
- Expandable sections with chevrons
- Icons next to menu items
- Full menu structure visible

**Mobile View:**
- Shows mobile-optimized drawer menu
- Narrower width
- Touch-friendly sizing
- Scrollable if menu is long

### Toggle Between Views

Preview includes buttons to switch:
- **Desktop**: Full-width application menu
- **Mobile**: Mobile-optimized menu view

### What Preview Shows

| Element | Purpose |
|---------|---------|
| **Sections** | Expandable menu buttons with icons |
| **Chevron Icons** | Indicate expand/collapse state |
| **Group Names** | Sub-menu headers (if not hidden) |
| **Menu Items** | Clickable links with icons |
| **Route Labels** | Shows route or "External" label (read-only) |
| **Color Scheme** | Uses current theme colors |

### Preview Behavior

**Expanding/Collapsing:**
- User can click sections and groups to expand/collapse in preview
- This is for visual checking only
- Does NOT save expansion state
- When returning to structure editor, expansion state resets

**No Navigation:**
- Menu items in preview are NOT clickable
- Preview is informational only
- Real navigation only works on live menu after publishing

### Important Distinction

| Feature | Effect on Live App | Effect on Users |
|---------|---|---|
| **Preview** | No effect | No effect; internal testing only |
| **Draft** | No effect | No effect; saved changes not published |
| **Reset** | Reverts changes | No effect; only reverts editor to last published |
| **Publish** | Applies to live app | All users see new menu immediately |

---

## 2.10 Reset Menu

### What "Reset" Does

**Definition:** Reset discards all unsaved changes and reverts the menu structure to the last published version.

### When to Use Reset

| Scenario | Reason |
|----------|--------|
| User made mistakes | Undo all changes and start fresh |
| User changed mind | Decided not to make changes after all |
| User wants to abandon draft | Discard unfinished work |
| User wants to compare | Reset to see last published state |

### Confirmation Dialog

Before resetting, system shows confirmation:

**Dialog Content:**

| Field | Content |
|-------|---------|
| **Title** | "Reset menu to last published version?" |
| **Message** | "All unsaved changes will be lost. This cannot be undone." |
| **Warning** | "This will not affect the live navigation until you publish." |
| **Cancel Button** | "Cancel" - abort reset, keep draft |
| **Confirm Button** | "Reset" - proceed with reset |

### What Happens After Reset

| Aspect | Result |
|--------|--------|
| **Draft Config** | Reverts to last published configuration |
| **Live Menu** | No change; still uses previously published menu |
| **Status Badge** | Remains as is (no change) |
| **Editor State** | Clears all pending changes |
| **Preview** | Updates to show last published menu |

### Important Note

**Reset Only Affects Draft:**
- Reset does NOT change the live menu that users see
- Live menu only changes when user clicks "Publish"
- Users will not be affected by a reset operation

---

## 2.11 Save Menu as Draft

### What "Save as Draft" Does

**Definition:** Persists current menu configuration changes locally with Draft status, without publishing to live menu.

### When to Use Save Draft

| Scenario | Reason |
|----------|--------|
| Work in progress | User wants to save and finish later |
| Team review needed | Changes saved for manager/team approval |
| Ongoing experiments | User testing different menu structures |
| Backup changes | Protect work from accidental loss |

### Where Draft Is Saved

**Storage Location:**
- Browser localStorage
- Key: `menu-builder:draft-config`
- Persists across sessions

**Who Can See It:**
- Only the current user while editing
- Admins can see if they open Menu Builder
- Not visible to other users or in live menu

### After Saving as Draft

| Aspect | Result |
|--------|--------|
| **Status Badge** | Shows "Draft" (if not already) |
| **Save Button** | Disabled (no unsaved changes) |
| **Metrics** | Update to show current counts |
| **Confirmation Message** | "Draft saved locally" appears |
| **Data Persisted** | Changes saved to localStorage |

### Draft State Behavior

**Before Saving Draft:**
- Editor shows "Unsaved Changes" indicator
- Save Draft button is enabled
- Page shows isDirty = true

**After Saving Draft:**
- Editor clears unsaved changes indicator
- Save Draft button is disabled
- Changes are persisted

**When Making New Changes:**
- Editor marks changes as unsaved again
- Save Draft button becomes enabled
- User must save again to persist new changes

---

## 2.12 Publish Menu

### What "Publish" Does

**Definition:** Applies current menu configuration to the live application. All users immediately see the new menu structure in their sidebar.

### Before Publishing: Validation

The system validates the menu configuration:

| Validation Rule | Error Message | Fix |
|-----------------|---|---|
| Menu has sections | "Menu must have at least one section" | Add a section |
| Sections have names | "All sections must have names" | Name each section |
| Groups have names | "All groups must have names" | Name each group |
| Items have labels | "All items must have labels" | Add labels to items |
| Items have routes or URLs | "Items must have routes or external URLs" | Set route or URL |
| No circular references | "Invalid menu hierarchy" (if applicable) | Restructure menu |

**Important:** Publish button is disabled if any validation errors exist.

### What Changes After Publishing

| Change | Impact | Visible To |
|--------|--------|-----------|
| **Status = Published** | Menu is now live | Admins in Theme Builder |
| **Live Menu Updates** | All users see new structure | All application users immediately |
| **localStorage Persisted** | Changes saved to persistent storage | App restart preserves changes |
| **Success Message** | Confirmation notification | User who published |

### User Experience After Publishing

1. **Admin clicks "Publish"**
2. **System validates menu**
3. **Confirmation dialog appears** (see section 2.12a)
4. **Admin clicks "Confirm"**
5. **Menu is published**
6. **Live application sidebar updates immediately**
7. **All users refresh and see new menu** (or on next navigation)
8. **Confirmation message:** "Menu configuration published successfully!"

### Can User Unpublish?

- User cannot "unpublish" a menu
- User can publish again with different structure
- User can Reset to revert changes before publishing
- Once published, it's live until next publish

---

## 2.12a Publish Confirmation Dialog

### Dialog Appearance

**Before Publishing, Dialog Shows:**

| Element | Content |
|---------|---------|
| **Title** | "Publish navigation menu?" |
| **Message** | "The menu structure will be applied to the live application. All users will see the updated navigation." |
| **Warning** (if applicable) | "Unsaved changes will be included in the published menu." |
| **Cancel Button** | "Cancel" - return to editor |
| **Confirm Button** | "Publish" - proceed with publishing |

### Dialog Behavior

- Dialog appears when user clicks Publish button
- User must explicitly confirm to proceed
- User can cancel without making changes
- After confirmation, menu is published

---

## 2.13 Navigation Sidebar Update

### How Published Menu Affects Live Navigation

**Before Publishing:**
- Users see the last published menu
- Draft changes have no effect on users
- Menu is stable and unchanging

**After Publishing:**
- Users see the new menu structure immediately
- Sidebar reflects new sections, groups, items
- Menu items link to configured routes

### Real-Time Updates

**When Update Happens:**
- **Immediately after publish:** Menu is available in application
- **On page reload:** New menu loads from storage
- **For new sessions:** New users see new menu

### Fallback Navigation

**If No Published Menu Exists:**
The application falls back to a default menu structure:

**Needs Confirmation from Project Team:**
- What is the default/fallback menu?
- Where is it defined?
- Is it hardcoded or in configuration?

**Related File:** (Needs confirmation - likely in appShellShared.ts or similar)

### Menu Update Flow

| Step | Action | User Sees |
|------|--------|-----------|
| 1 | Admin publishes menu in Menu Builder | "Menu published successfully" message |
| 2 | Menu stored to localStorage with published flag | No change yet |
| 3 | AppSidebar component reads published menu | Sidebar updates if already rendered |
| 4 | User refreshes page | New menu loads from storage |
| 5 | User sees new menu structure | Updated sections, groups, items |

### Do Draft and Reset Affect Live Navigation?

| Action | Affects Live Navigation? | Explanation |
|--------|---|---|
| **Save Draft** | No | Draft is not published |
| **Reset** | No | Reverts editor only, doesn't publish |
| **Preview** | No | Preview is read-only testing |
| **Publish** | Yes | Applies to live menu |

---

## 2.14 Menu Builder States and Validation

### Empty State

**When It Appears:**
- No menu structure has been created
- Or all sections have been deleted

**What User Sees:**
- Message in tree area: "No sections yet. Create one to get started."
- Add Section button is prominent
- Preview shows empty state: "No menu items to preview"

### Loading State

**When It Appears:**
- Menu Builder is initializing
- Loading published menu from storage
- Initial page load

**What User Sees:**
- Spinner/loading indicator
- Message: "Loading menu builder..."
- Page is not interactive until loaded

### Validation Error State

**When It Appears:**
- User tries to publish with invalid configuration
- User attempts invalid drag-and-drop
- User leaves required fields empty in forms

**What User Sees:**

| Component | Display |
|-----------|---------|
| **Validation Summary** | "X validation issues found" banner |
| **Error List** | Red text showing each error |
| **Invalid Fields** | Highlighted in forms |
| **Metrics Status** | Shows "Review" instead of "Ready" |

### Validation Error Examples

| Error | Message | Fix |
|-------|---------|-----|
| Empty section name | "Section 'Untitled' requires a name" | Name the section |
| Missing group parent | "Group must belong to a section" | Assign parent section |
| Item without route | "Menu item 'Dashboard' needs a route or URL" | Set route or external URL |
| Empty item label | "Item label is required" | Add item label |

### Ready State

**When Configuration Is Valid:**
- All required fields filled
- All items have labels and routes
- Menu has at least one section

**What User Sees:**
- Metrics status shows "Ready"
- Publish button is enabled
- No validation errors displayed
- Green checkmarks next to valid items (if visible)

### Success State

**After Publish or Save Draft:**

| Action | Message | Duration |
|--------|---------|----------|
| **Publish** | "Menu configuration published successfully!" | 3 seconds |
| **Save Draft** | "Draft saved locally" | 3 seconds |
| **Reset** | "Menu has been reset to the published version" | 3 seconds |
| **Create/Edit** | "[Section/Group/Item] created successfully" | 3 seconds |

---

# SECTION 3: COMMON UI COMPONENTS

---

## 3.1 Shared Components Used in Both Features

Both Theme Builder and Menu Builder use common UI components provided by the application framework. These components ensure consistency and reusability.

### Component Usage Summary

| Component | Theme Builder | Menu Builder | Purpose |
|-----------|---|---|---------|
| **Button** | Yes | Yes | Action triggers (Create, Edit, Save, Publish) |
| **Input Field** | Yes | Yes | Text entry for names, labels, descriptions |
| **Select/Dropdown** | Yes | Yes | Choose from options (fonts, colors, parents) |
| **Color Picker** | Yes | No | Visual color selection with hex input |
| **File Uploader** | Yes | No | Logo/image upload for themes |
| **Dialog/Modal** | Yes | Yes | Forms for creating/editing items |
| **Confirmation Dialog** | Yes | Yes | Confirm destructive actions |
| **Status Badge** | Yes | Yes | Visual status indicator |
| **Preview Panel** | Yes | Yes | Side-by-side preview of changes |
| **Tree/List View** | No | Yes | Hierarchical menu structure display |
| **Drag Handle** | No | Yes | Drag-and-drop indicator |
| **Form Grid** | Yes | Yes | Multi-column form layout |
| **Toast/Notification** | Yes | Yes | Success/error messages |

---

## 3.2 Buttons

### Button Types in Theme Builder and Menu Builder

| Button Type | Used In | Purpose | State |
|-------------|---------|---------|-------|
| **Primary** | Both | Main action (Publish, Save) | Blue, enabled/disabled |
| **Secondary** | Both | Preview, Reset | Gray/outline style |
| **Outline** | Both | Less prominent (Cancel, Back) | Border only, no fill |
| **Danger/Destructive** | Menu Builder | Delete, Remove | Red, shows warning |
| **Icon Button** | Both | Compact action (Edit, Delete) | Small icon only |
| **Ghost** | Both | Least prominent (Back, Close) | Minimal styling |

### Button Behavior

| Action | Disabled When | Appears As | Tooltip |
|--------|---|---|---|
| **Publish** | Menu invalid, theme incomplete | Grayed out | "Fix validation errors before publishing" |
| **Save Draft** | No changes made | Grayed out | "No unsaved changes" |
| **Create** | Form incomplete | Enabled until invalid | Shows validation errors |
| **Edit** | No item selected | Grayed out | "Select an item to edit" |
| **Delete** | Cannot remove (parent has children) | Grayed out | "Remove child items first" |

**Related Files:**
- [src/components/app/AppButton.tsx](src/components/app/AppButton.tsx)

---

## 3.3 Input Fields and Text Boxes

### Text Input Fields

Used for entering names, labels, descriptions, URLs.

| Context | Field Type | Max Length | Help Text |
|---------|-----------|-----------|-----------|
| **Theme Name** | Text | 100 chars | "Name of your theme (e.g., Ocean Blue)" |
| **Theme Description** | Text Area | 500 chars | "Description of theme purpose or use case" |
| **Short Label** | Text | 4 chars | "2-4 uppercase letters for logo fallback" |
| **Section Name** | Text | 100 chars | "Name of menu section (e.g., Procurement)" |
| **Section Description** | Text Area | 500 chars | "Optional description of section purpose" |
| **Item Label** | Text | 100 chars | "Name shown in menu to users" |
| **Item Route** | Text | 500 chars | "Internal route (e.g., /purchase-order/create)" |
| **External URL** | Text | 500 chars | "Full URL (e.g., https://help.example.com)" |

### Input Field Validation

**Real-Time Feedback:**
- As user types, system validates input
- Error messages appear below field
- Field border highlights red if invalid
- Character count shown if max length defined

**Related Files:**
- [src/components/common/FormControls.tsx](src/components/common/FormControls.tsx)

---

## 3.4 Dropdowns and Selects

### Dropdown Types

| Dropdown | Options | Used In | Purpose |
|----------|---------|---------|---------|
| **Font Family Select** | Noto Sans, Arial, Inter, Georgia, Verdana | Theme Builder | Choose font |
| **Font Weight Select** | Regular, Medium, Semibold, Bold | Theme Builder | Choose font weight |
| **Shadow Style Select** | Soft, Medium, Strong | Theme Builder | Choose shadow depth |
| **Parent Section Select** | All sections | Menu Builder (Group creation) | Assign parent section |
| **Parent Group Select** | All groups in all sections | Menu Builder (Item creation) | Assign parent group |
| **Icon Select** | Available icons | Both | Choose icon for item |
| **Text Transform Select** | Sentence case, UPPERCASE | Theme Builder | Button text style |

### Dropdown Behavior

- **Single selection:** Only one option can be selected
- **Required field:** An option must be selected before save
- **Searchable** (if many options): User can type to filter
- **Disabled state:** Grayed out when no options available

---

## 3.5 Color Picker

### How Color Picker Works

**Dual Input Method:**

1. **Visual Picker**
   - Click on color swatch to open HTML5 color picker
   - User clicks on color gradient area
   - Right slider adjusts brightness
   - Selected color updates preview in real-time

2. **Hex Code Input**
   - Manual text entry of hex value (e.g., #FF5733)
   - Valid format: #RRGGBB or #RGB
   - Field validates on blur or Enter key
   - Shows error if invalid

### Validation and Constraints

| Constraint | Example | Error Message |
|-----------|---------|---|
| **Valid hex** | #FF5733 | (No error) |
| **Short hex** | #FFF | (accepted, expanded to #FFFFFF) |
| **Invalid format** | red, FF5733, #GGGGGG | "Use a valid HEX color." |
| **Empty field** | (blank) | Depends on required/optional |

**Related Files:**
- [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx) (ThemeColorPicker component)

---

## 3.6 File Uploader

### Logo Upload Component

**How It Works:**

1. **Initial State**
   - Shows "Upload Logo" button
   - Displays short label as placeholder (e.g., "TH")
   - Show file constraints message

2. **User Clicks Upload**
   - File dialog opens
   - User selects PNG, JPG, SVG, or WebP image
   - File is validated

3. **File Validation**
   - Checks file type (must be image)
   - Checks file size (max 512 KB)
   - Shows error if invalid

4. **Upload Success**
   - Image appears in preview
   - Filename shown (e.g., "logo.png")
   - "Remove" button appears
   - File converted to base64 data URL

### File Constraints

| Constraint | Value | Error if Violated |
|-----------|-------|---|
| **Supported formats** | PNG, JPG, SVG, WebP | "Logo must be a PNG, JPG, SVG, or WebP file." |
| **Max file size** | 512 KB | "Logo file must be 512 KB or smaller." |
| **Required?** | No, optional | Logo field can be empty |

### Remove Logo

- User clicks "Remove" button
- Logo is deleted
- Fallback to short label (e.g., "TH")
- Remove button disappears

**Related Files:**
- [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx) (ThemeLogoUploader component)

---

## 3.7 Dialog and Modal Forms

### Menu Form Dialog

**Appearance:**
- Modal overlay on top of main content
- Centered on screen
- Keyboard-navigable (Tab, Enter, Escape)
- Backdrop click closes (unless specified otherwise)

**Dialogs in Menu Builder:**

| Dialog | Title | Purpose | Fields |
|--------|-------|---------|--------|
| **Add/Edit Section** | "Add Section" or "Edit Section" | Create or modify section | Name, Description, Icon, Visibility |
| **Add/Edit Group** | "Add Group" or "Edit Group" | Create or modify group | Name, Parent Section, Description, Visibility |
| **Add/Edit Item** | "Add Menu Item" or "Edit Menu Item" | Create or modify item | Label, Key, Parent Group, Route/URL, Icon, Visibility |

**Dialogs in Theme Builder:**
- Theme creation/edit form (large, multi-section)

### Dialog Form Validation

- **Required fields highlighted** with asterisk (*)
- **Validation errors shown below each field** in red
- **Save/Create button disabled** if required field empty or invalid
- **Error summary** may appear at top of form

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Tab** | Move to next field |
| **Shift+Tab** | Move to previous field |
| **Enter** | Submit form (if Save button focused) |
| **Escape** | Close dialog (cancel) |

**Related Files:**
- [src/components/common/MenuBuilder/MenuFormDialog.tsx](src/components/common/MenuBuilder/MenuFormDialog.tsx)
- [src/components/common/CompactFormDialog.tsx](src/components/common/CompactFormDialog.tsx)

---

## 3.8 Confirmation Dialogs

### Standard Confirmation Pattern

Used for potentially destructive actions (Reset, Publish, Deactivate, Delete).

**Dialog Structure:**

| Element | Content | Example |
|---------|---------|---------|
| **Title** | Action being confirmed | "Reset menu to published version?" |
| **Description** | Explanation and consequences | "All unsaved changes will be lost. This cannot be undone." |
| **Warning** (optional) | Additional important info | "This will not affect the live navigation." |
| **Cancel Button** | Abort the action | "Cancel" |
| **Confirm Button** | Proceed with action | "Reset" or "Yes" |

### Confirmation Dialog Types

| Dialog | Title | Message | Action |
|--------|-------|---------|--------|
| **Reset Menu** | "Reset menu?" | "All unsaved changes will be lost. This cannot be undone." | Reset |
| **Publish Menu** | "Publish menu?" | "The menu will be applied live. All users will see updates." | Publish |
| **Deactivate Theme** | "Deactivate theme?" | "Theme will be removed from dropdown. Users keeping it will see it unchanged." | Deactivate |
| **Delete Item** | "Delete this item?" | "This will remove the item from the menu. Cannot be undone." | Delete |

**Related Files:**
- [src/components/common/ConfirmationDialog.tsx](src/components/common/ConfirmationDialog.tsx)
- [src/components/common/MenuBuilder/MenuConfirmationDialog.tsx](src/components/common/MenuBuilder/MenuConfirmationDialog.tsx)

---

## 3.9 Status Badge Component

### Purpose

Displays the current status of a theme or menu configuration with visual indicator.

### Status Badge Styling

| Status | Badge Color | Background | Text | Meaning |
|--------|-------------|-----------|------|---------|
| **Draft** | Gray | Light gray | Gray text | Not yet published |
| **Published** | Blue | Light blue | Blue text | Available but not active |
| **Active** | Green | Light green | Green text | Currently in use |
| **Inactive** | Red/Gray | Light red/gray | Red/gray text | Deactivated, no longer available |

### Badge Behavior

- Updates in real-time as status changes
- Shows only one primary status
- May include secondary indicators (e.g., "unsaved changes")
- Used in list views and form headers

**Related Files:**
- [src/components/common/StatusBadge.tsx](src/components/common/StatusBadge.tsx)
- [src/components/common/MenuBuilder/MenuStatusBadge.tsx](src/components/common/MenuBuilder/MenuStatusBadge.tsx)

---

## 3.10 Preview Panels

### Side-by-Side Preview

**Layout:**
- Main form/editor: Left or top
- Live preview: Right or bottom
- Resizable divider (optional)
- Preview updates in real-time

**Used In:**
- Theme Builder: Color/font changes reflected in preview immediately
- Menu Builder: Menu structure changes reflected in preview immediately

### Full-Screen Preview Mode

**Used For:**
- Large preview of theme appearance
- Detailed inspection before publishing
- Testing different viewport sizes (desktop/mobile)

### Preview Characteristics

- **Read-only:** No interaction on preview elements
- **Real-time:** Updates as values change
- **Responsive:** Shows desktop and mobile layouts
- **Styled:** Uses actual theme/menu styling for accurate representation

---

## 3.11 Notification and Toast Messages

### Success Messages

**When They Appear:**
- After successful save
- After successful publish
- After successful action (create, update, delete)

**Examples:**
- "Theme saved as draft successfully"
- "Theme published successfully"
- "Menu configuration published successfully!"
- "Section created successfully"
- "Menu item updated successfully"

**Duration:** Typically 3-5 seconds, then auto-dismiss

| Message Type | Background Color | Icon | Auto-dismiss |
|--------------|---|---|---|
| **Success** | Green | Checkmark | Yes, 3-5 sec |
| **Error** | Red | X or warning | No, user click to dismiss |
| **Warning** | Amber/Orange | Warning icon | No |
| **Info** | Blue | Info icon | Yes, 5-10 sec |

### Error Messages

**When They Appear:**
- Validation errors in forms
- Save/publish failures
- Network errors (if applicable)

**Examples:**
- "Theme name is required."
- "Invalid HEX color: use format #RRGGBB"
- "Cannot publish: fix validation errors"

**Duration:** Remains visible until user dismisses or fixes issue

**Related Files:**
- Various components display notifications

---

# SECTION 4: FORM LAYOUT DOCUMENTATION

---

## 4.1 Theme Builder Form Layout

### Overall Structure

The Theme Builder form is organized into logical sections to guide users through theme creation:

```
┌─────────────────────────────────────────────────────────┐
│                     Hero Section                         │
│  Page Title, Subtitle, Action Buttons                    │
├──────────────────────────────────────────────────────────┤
│                   Success Message                        │
│  (appears after successful action)                       │
├─────────────────────┬──────────────────────────────────┤
│   Form (2/3 width)  │  Preview (1/3 width)             │
│                     │  • Live theme preview            │
│ • Basic Details     │  • Updates real-time             │
│ • Brand Logo        │  • Sample layout                 │
│ • Colors            │  • Color swatches                │
│ • Typography        │                                   │
│ • Layout            │                                   │
│ • Action Buttons    │                                   │
└─────────────────────┴──────────────────────────────────┘
```

### Form Sections Layout

#### Section 1: Basic Details

**Visual Layout:**
- Two-column grid (desktop)
- Full-width (mobile)

| Column 1 | Column 2 |
|----------|----------|
| Theme Name | Short Label |
| Description (spans both columns) | |

#### Section 2: Brand Logo

**Visual Layout:**
- Card with logo preview on left, upload controls on right

```
┌─────────────────────────────────────┐
│ [Logo Preview] │ Upload Logo Button │
│ (square image) │ Remove Logo Button │
│ or letters     │ File constraints  │
└─────────────────────────────────────┘
```

#### Section 3: Colors

**Visual Layout:**
- Grid of 16 color fields, 2-3 columns

Each color field contains:
```
┌──────────────────────────┐
│ [Color Swatch] [Label]   │
│ [Helper Text]            │
│ [Color Picker] [Hex Box] │
└──────────────────────────┘
```

#### Section 4: Typography

**Visual Layout:**
- Grid of typography controls, 2 columns

| Left | Right |
|------|-------|
| Body Font | Heading Font |
| Base Font Size | Font Weight |
| Line Height | Button Text Style |

#### Section 5: Layout

**Visual Layout:**
- Grid of spacing/design controls, 2 columns

| Left | Right |
|------|-------|
| Border Radius | Button Radius |
| Card Radius | Input Radius |
| Spacing Scale | Shadow Style |

### Action Buttons Layout

**Position:** Top-right of form header and/or bottom-right of form

```
[Cancel] [Save Draft] [Preview] [Publish]
```

**Desktop:** Buttons in horizontal row
**Mobile:** May wrap to 2-3 rows or use floating action menu

---

## 4.2 Menu Builder Form Layout

### Menu Builder Page Overall Layout

**Main Page Structure:**

```
┌──────────────────────────────────────────────────────────┐
│                     Hero Section                         │
│  Back Button, Page Title, Subtitle                        │
│  Status Badge, Action Buttons (Reset, Save, Publish)    │
│  Metrics Display (Sections, Groups, Items, Status)      │
├──────────────────────────────────────────────────────────┤
│               Success/Info Messages                      │
├──────────────────────────────────────────────────────────┤
│                 Validation Summary                       │
│  (if errors exist)                                       │
├──────────────────────┬──────────────────────────────────┤
│  Structure Editor    │     Menu Preview                 │
│  (2/3 width)         │     (1/3 width)                  │
│                      │                                   │
│  • Add Section btn   │  • Live preview                  │
│  • Menu Tree         │  • Desktop/Mobile toggle         │
│    - Sections        │  • Expandable sections           │
│    - Groups          │  • Sample items                  │
│    - Items           │  • Icons and routes              │
│  • Drag handles      │                                   │
│  • Action buttons    │                                   │
└──────────────────────┴──────────────────────────────────┘
```

### Tree Structure Display

**Visual Hierarchy:**

```
Section (expandable)
├─ [+] Add Group Button
├─ Group (expandable)
│  ├─ Item
│  ├─ Item
│  └─ Item
├─ Group
│  └─ Item
└─ Group (empty)

Section
└─ Group
   └─ Item
```

**Column Layout (left to right):**
1. Drag handle (::)
2. Expand/collapse chevron
3. Name/label
4. Action buttons (Add, Edit, Delete)

### Form Dialog Layouts

#### Add/Edit Section Dialog

**Form Fields:**

```
┌─────────────────────────────────────┐
│        Add Section Dialog           │
├─────────────────────────────────────┤
│                                     │
│ Section Name *                      │
│ [____________________________]      │
│ (required field with help text)     │
│                                     │
│ Description                         │
│ [____________]                      │
│ [____________] (text area)          │
│                                     │
│ Icon                                │
│ [Dropdown: Choose Icon]             │
│                                     │
│ Visibility                          │
│ ☑ Visible to users                  │
│                                     │
├─────────────────────────────────────┤
│          [Cancel] [Create]          │
└─────────────────────────────────────┘
```

#### Add/Edit Item Dialog

**Form Fields:**

```
┌─────────────────────────────────────┐
│      Add Menu Item Dialog           │
├─────────────────────────────────────┤
│                                     │
│ Item Label *                        │
│ [________________________]          │
│                                     │
│ Item Key *                          │
│ [________________________]          │
│ (auto-generated from label)         │
│                                     │
│ Parent Group *                      │
│ [Dropdown: Select Group]            │
│ (or: Procurement / Purchase Orders) │
│                                     │
│ Route or External URL               │
│ ○ Route  [_____________]            │
│ ○ URL    [_____________]            │
│ ☑ Open in new tab                   │
│                                     │
│ Icon                                │
│ [Dropdown: Choose Icon]             │
│                                     │
│ Description                         │
│ [____________] (optional)           │
│                                     │
│ Visibility                          │
│ ☑ Visible to users                  │
│                                     │
├─────────────────────────────────────┤
│          [Cancel] [Create]          │
└─────────────────────────────────────┘
```

---

## 4.3 Form Layout Principles

### Responsive Behavior

**Desktop (1200px+):**
- Two-column layouts when appropriate
- Side-by-side preview panels
- Full width forms with clear spacing
- Multiple columns for grids

**Tablet (768px-1199px):**
- Single column layouts
- Stacked preview (preview below form)
- Reduced spacing
- Simplified grids (fewer columns)

**Mobile (<768px):**
- Full-width single column
- Stacked everything
- Touch-friendly button sizing
- Simplified dialogs

### Visual Hierarchy

**Using:**
- Larger headings for section titles
- Smaller headings for field groups
- Consistent spacing between sections
- Bold labels for field names
- Helper text below labels in gray
- Icons to indicate required fields (*)

### Field Organization

**Grouping Logic:**
- Related fields grouped together
- Clear visual separation between groups
- Most important fields at top
- Optional fields at bottom or in collapsible sections
- Actions at the bottom

### Accessibility

**Implemented Through:**
- Proper heading hierarchy (h1, h2, h3)
- Form field labels associated with inputs
- Error messages linked to fields
- Keyboard navigation support
- ARIA labels for screen readers
- Color not the only indicator (also use icons, text)

---

# SECTION 5: USER JOURNEY DOCUMENTATION

---

## 5.1 Theme Builder User Journey

### Typical Complete Flow: "Create a New Theme"

**User Goal:** Create a new company brand theme and publish it

**Step-by-Step Journey:**

| Step | What User Does | What System Does | What User Sees |
|------|---|---|---|
| 1 | Opens application, navigates to Theme Builder | App loads Theme Builder | List of existing themes |
| 2 | Clicks "New Theme" button | Form opens with default values | Blank theme creation form |
| 3 | Enters theme name: "Summer Orange" | System validates name uniqueness | Name field updated |
| 4 | Enters short label: "SO" | System updates preview | Label field updated |
| 5 | Updates primary color to orange (#FF8C00) | Color picker updates preview | Color swatch shows orange |
| 6 | Updates secondary colors (pink, yellow) | Each color updates preview | All swatches update |
| 7 | Selects font family: "Inter" | Typography preview updates | Font changes in preview |
| 8 | Uploads logo image (company.png) | Logo is processed and displayed | Logo appears in preview |
| 9 | Clicks "Preview" button | Full-screen preview opens | User sees complete theme mockup |
| 10 | Reviews colors, fonts, logo | None | User inspects appearance |
| 11 | Closes preview, returns to form | Form is as before | Same form state |
| 12 | Clicks "Save Draft" button | Theme saved with Draft status | List shows "Draft" theme |
| 13 | Navigates away and returns later | Theme is still saved | Theme list shows draft |
| 14 | Opens theme for editing | Form populates with draft values | All values preserved |
| 15 | Makes final tweaks | Values update | Form reflects changes |
| 16 | Clicks "Publish" button | Validation runs | Button may gray out if invalid |
| 17 | All validation passes | Confirmation dialog appears | Dialog shows "Publish theme?" |
| 18 | Clicks "Confirm" in dialog | Theme is published | Confirmation message appears |
| 19 | Navigates to header dropdown | System loads published themes | "Summer Orange" appears in dropdown |
| 20 | User selects "Summer Orange" from header | Theme applies instantly | App shows orange theme colors |

### Alternative Flow: "Quick Update to Existing Theme"

**User Goal:** Modify a published theme's colors

**Steps:**
1. Open Theme Builder
2. Click "Edit" on existing published theme
3. Change one or more colors
4. Click "Preview" to verify
5. Click "Publish" (overwrites existing theme)
6. Confirm publication
7. Theme is immediately updated for all users

### Alternative Flow: "Draft to Deactivate"

**User Goal:** Remove a theme from circulation but keep it for reference

**Steps:**
1. Open Theme Builder
2. Find published theme
3. Click "Deactivate"
4. Confirm deactivation
5. Theme status changes to "Inactive"
6. Theme no longer appears in user dropdown
7. Existing users keep their selection but can't switch back to it

---

## 5.2 Menu Builder User Journey

### Typical Complete Flow: "Reorganize Navigation Menu"

**User Goal:** Add new "Analytics" section and reorganize menu structure

**Step-by-Step Journey:**

| Step | What User Does | What System Does | What User Sees |
|------|---|---|---|
| 1 | Opens Menu Builder | App loads published menu as draft | Structure editor shows current menu |
| 2 | Clicks "Add Section" | Form dialog opens | Add Section form appears |
| 3 | Enters "Analytics" as name | Form validates | Form accepts input |
| 4 | Selects Analytics icon | Icon selector updated | Icon selected |
| 5 | Clicks "Create" | Section added to structure | New section appears in tree |
| 6 | Clicks "+" on Analytics section | Add Group form opens | Dialog for new group |
| 7 | Enters "Reports" as group name | Form validates | Form accepts input |
| 8 | Clicks "Create" | Group added under Analytics | Tree shows Analytics > Reports |
| 9 | Clicks "+" on Reports group | Add Item form opens | Dialog for menu item |
| 10 | Enters item details: | Form validates | Form fills with values |
| - Item label: "Sales Report" | | |
| - Route: "/reports/sales" | | |
| - Icon: chart icon | | |
| 11 | Clicks "Create" | Item added to Reports | Tree shows item under group |
| 12 | Repeats for more items | Each item added | Tree grows with items |
| 13 | Drags "Reports" group | Group moves to new position | Tree reorders in real-time |
| 14 | Looks at Menu Preview | Preview updates live | Preview shows new structure |
| 15 | Clicks "Reset" button | Revert confirmation appears | Confirmation dialog shown |
| 16 | Clicks "Cancel" (changed mind) | Dialog closes | No reset occurs |
| 17 | Clicks "Save Draft" | Changes saved to localStorage | Success message appears |
| 18 | Takes a screenshot to share | None | User captures current state |
| 19 | Returns to Menu Builder next day | Draft is still there | Previous state preserved |
| 20 | Clicks "Publish" | Validation runs | Button enables if valid |
| 21 | Confirmation dialog appears | None | Dialog shows warning |
| 22 | Clicks "Confirm Publish" | Menu is published | Success message appears |
| 23 | All users refresh app | Navigation sidebar updates | New menu structure visible |

### Alternative Flow: "Quick Reorder"

**User Goal:** Move a menu item to different section

**Steps:**
1. Open Menu Builder
2. In tree view, find menu item to move
3. Click "Edit" on item
4. Change "Parent Group" dropdown to different group
5. Click "Save"
6. Item moves to new location
7. Preview updates
8. Click "Publish" to make live

### Alternative Flow: "Drag-and-Drop Reorganization"

**User Goal:** Reorder multiple menu items quickly

**Steps:**
1. Open Menu Builder
2. Find first item to move
3. Click and drag item to new position
4. Item moves, tree updates, preview updates
5. Repeat for other items
6. Click "Save Draft" to persist changes
7. Click "Publish" when ready

---

# SECTION 6: PERMISSIONS AND ACCESS CONTROL

---

## 6.1 Theme Builder Permissions

### Who Can Access Theme Builder?

**Required Role:**
- Administrator
- Business Settings Editor
- Theme Manager

(Needs confirmation from project team regarding exact role names)

### Who Can Perform Actions?

| Action | Required Role | Can Undo? | Affects Users |
|--------|---|---|---|
| **Create Draft Theme** | Theme Manager+ | Yes | No |
| **Save Draft** | Theme Manager+ | Yes | No |
| **Preview Theme** | Theme Manager+ | N/A (read-only) | No |
| **Publish Theme** | Theme Manager+ | Yes (re-publish) | Yes |
| **Deactivate Theme** | Theme Manager+ | Yes (re-publish) | Yes |
| **Edit Published Theme** | Theme Manager+ | Yes (revert via publish) | Potentially |
| **Delete Theme** | Administrator | No | Potentially |

### Guest User Access

- **Can Access Theme Builder:** No
- **Can See Published Themes:** Yes (in header dropdown)
- **Can Select Theme:** Yes (choose from available themes)

### Field-Level Permissions

**Needs Confirmation from Project Team:**
- Can non-admins edit certain fields only?
- Are certain color fields restricted?
- Can managers only deactivate, not delete?

---

## 6.2 Menu Builder Permissions

### Who Can Access Menu Builder?

**Required Role:**
- Administrator
- Navigation Editor
- Menu Manager

(Needs confirmation from project team regarding exact role names)

### Who Can Perform Actions?

| Action | Required Role | Can Undo? | Affects Users |
|--------|---|---|---|
| **Create Section** | Menu Manager+ | Yes | No (if not published) |
| **Create Group** | Menu Manager+ | Yes | No (if not published) |
| **Create Item** | Menu Manager+ | Yes | No (if not published) |
| **Edit Any Element** | Menu Manager+ | Yes | No (if not published) |
| **Delete Any Element** | Menu Manager+ | Yes | No (if not published) |
| **Save Draft** | Menu Manager+ | Yes | No |
| **Reset to Published** | Menu Manager+ | N/A | No |
| **Preview** | Menu Manager+ | N/A | No |
| **Publish Menu** | Administrator+ | Yes (re-publish) | Yes |

### Guest User Access

- **Can Access Menu Builder:** No
- **Can See Menu:** Yes (in sidebar)
- **Can Click Menu Items:** Yes (navigate to pages)

---

# SECTION 7: BUSINESS RULES AND CONSTRAINTS

---

## 7.1 Theme Builder Business Rules

| Rule | Why It Exists | Behavior |
|------|---|---|
| **Theme name must be unique** | Prevents confusion between themes | System rejects duplicate names |
| **Color values must be valid HEX** | Ensures consistency in color rendering | Invalid colors show error |
| **Logo must be under 512 KB** | Ensures fast loading and storage limits | Larger files rejected |
| **Logo must be PNG/JPG/SVG/WebP** | Ensures compatibility and performance | Other formats rejected |
| **Short label must be 2-4 characters** | Fits in logo fallback display area | System validates length |
| **Draft themes don't appear in dropdown** | Prevents incomplete themes from users | Draft hidden from selection |
| **Published themes appear in dropdown** | Users can only select complete themes | Published visible in selection |
| **Only one theme can be active** | Prevents visual inconsistency | System enforces single active |
| **Deactivated themes cannot be selected** | Prevents deprecated themes from use | Dropdown removes after deactivate |
| **Cannot delete while in use** | Prevents breaking user experience | System disables delete button |
| **Preview doesn't apply theme** | Prevents accidental live changes | Preview is temporary only |

---

## 7.2 Menu Builder Business Rules

| Rule | Why It Exists | Behavior |
|------|---|---|
| **Menu must have at least one section** | Ensures menu structure exists | System prevents empty menu |
| **Each section must have a name** | Enables clear categorization | System requires name before save |
| **Each group must belong to a section** | Maintains hierarchy integrity | System prevents orphaned groups |
| **Each item must belong to a group** | Maintains hierarchy structure | System prevents orphaned items |
| **Items must have labels and keys** | Enables identification and routing | System requires both fields |
| **Items must have routes or URLs** | Enables navigation to destination | System requires at least one |
| **Sections can be reordered** | Allows flexible organization | Drag/drop within same level |
| **Groups can move between sections** | Allows reorganization | Drag to different section |
| **Items can move between groups** | Allows flexible structure | Drag between groups allowed |
| **Circular references prevented** | Prevents invalid hierarchies | System prevents parent-as-child |
| **Maximum 3 levels (sections, groups, items)** | Prevents overly deep nesting | System enforces 3-level structure |
| **Draft menu doesn't affect live navigation** | Prevents incomplete changes from users | Live menu unchanged until publish |
| **Reset only reverts editor, not live menu** | Prevents accidental live changes | Reset local only, user must publish |
| **Publish applies immediately** | Ensures users see new structure | No delay in application |
| **Cannot hide all menu items** | Ensures users can always navigate | System prevents empty structure |

---

# SECTION 8: ERROR MESSAGES AND VALIDATION

---

## 8.1 Theme Builder Validation and Error Messages

| Validation | Error Message | Where Shown | How to Fix |
|-----------|---|---|---|
| **Empty theme name** | "Theme name is required." | Below name field | Enter a theme name |
| **Duplicate theme name** | "Theme name must be unique." | Below name field | Choose different name |
| **Invalid HEX color** | "Use a valid HEX color." | Below color field | Enter valid hex (e.g., #FF5733) |
| **Empty short label (before publish)** | "Short label is required before publishing." | Below label field | Enter 2-4 character label |
| **Logo file wrong format** | "Logo must be a PNG, JPG, SVG, or WebP file." | In upload section | Select PNG, JPG, SVG, or WebP |
| **Logo file too large** | "Logo file must be 512 KB or smaller." | In upload section | Compress image or choose smaller file |
| **Invalid font selection** | "Selected font is not supported." | Below font field | Choose from dropdown options |
| **Invalid number range** | "Value must be between X and Y." | Below numeric field | Enter number within specified range |
| **Form cannot be saved** | "Fix validation errors before saving." | Top of form | Address all errors marked in red |
| **Publish failed** | "Cannot publish: configuration has errors" | Pop-up notification | Fix all validation errors |

---

## 8.2 Menu Builder Validation and Error Messages

| Validation | Error Message | Where Shown | How to Fix |
|-----------|---|---|---|
| **Empty section name** | "Section name is required" | In form or tree | Name the section |
| **Empty group name** | "Group name is required" | In form or tree | Name the group |
| **Empty item label** | "Item label is required" | In form or tree | Add label to item |
| **Empty item key** | "Item key is required" | In form or tree | Enter or generate key |
| **No route or URL** | "Item must have a route or external URL" | In form | Set route or external URL |
| **Invalid URL format** | "Enter a valid external URL (starts with http)" | In form | Correct URL format |
| **No parent section selected** | "Select a parent section" | In form dropdown | Choose parent section |
| **No parent group selected** | "Select a parent group" | In form dropdown | Choose parent group |
| **Menu has no sections** | "Menu must have at least one section" | Validation summary | Add a section |
| **Empty menu structure** | "Cannot publish empty menu" | Pop-up notification | Add sections, groups, items |
| **Publish failed** | "Fix validation errors before publishing" | Pop-up notification | Review all errors |
| **Invalid circular reference** | "Invalid menu hierarchy detected" | Validation summary | Restructure menu |

---

# SECTION 9: RELATED FILES AND TECHNICAL REFERENCE

---

## 9.1 Complete File Reference

### Theme Builder Files

| File Path | File Type | Purpose | Description |
|-----------|-----------|---------|---|
| [src/pages/profile/ThemeBuilder.tsx](src/pages/profile/ThemeBuilder.tsx) | React Component | Main Theme Builder page | Handles list view, form, dialogs, preview |
| [src/theme/customThemeBuilder.ts](src/theme/customThemeBuilder.ts) | TypeScript Utility | Theme business logic | Theme validation, serialization, persistence |
| [src/theme/themeRegistry.ts](src/theme/themeRegistry.ts) | TypeScript Config | Built-in theme registry | Defines system themes (Excellon, etc.) |
| [src/theme/ThemeProvider.tsx](src/theme/ThemeProvider.tsx) | React Provider | Global theme context | Provides theme to app, handles switching |
| [src/theme/useTheme.ts](src/theme/useTheme.ts) | React Hook | Theme consumption hook | Components use to access current theme |
| [src/components/common/ThemeSwitcher.tsx](src/components/common/ThemeSwitcher.tsx) | React Component | Theme dropdown in header | Displays published themes for selection |
| [src/styles/excellon-brand-guidelines.css](src/styles/excellon-brand-guidelines.css) | CSS | Global styles | Theme variables and styling rules |

### Menu Builder Files

| File Path | File Type | Purpose | Description |
|-----------|-----------|---------|---|
| [src/pages/profile/MenuBuilder.tsx](src/pages/profile/MenuBuilder.tsx) | React Component | Menu Builder page wrapper | Routes to MenuBuilderPage component |
| [src/components/common/MenuBuilder/MenuBuilderPage.tsx](src/components/common/MenuBuilder/MenuBuilderPage.tsx) | React Component | Main Menu Builder interface | Coordinates all menu builder features |
| [src/components/common/MenuBuilder/MenuTree.tsx](src/components/common/MenuBuilder/MenuTree.tsx) | React Component | Menu structure tree display | Renders hierarchical menu with drag-drop |
| [src/components/common/MenuBuilder/MenuPreview.tsx](src/components/common/MenuBuilder/MenuPreview.tsx) | React Component | Live menu preview | Shows how menu appears to users |
| [src/components/common/MenuBuilder/MenuFormDialog.tsx](src/components/common/MenuBuilder/MenuFormDialog.tsx) | React Component | Forms for create/edit | Section, group, and item forms |
| [src/components/common/MenuBuilder/MenuConfirmationDialog.tsx](src/components/common/MenuBuilder/MenuConfirmationDialog.tsx) | React Component | Confirmation dialogs | Reset, publish, delete confirmations |
| [src/components/common/MenuBuilder/MenuStatusBadge.tsx](src/components/common/MenuBuilder/MenuStatusBadge.tsx) | React Component | Status indicator | Shows draft/published status |
| [src/components/common/MenuBuilder/MenuValidationSummary.tsx](src/components/common/MenuBuilder/MenuValidationSummary.tsx) | React Component | Validation display | Shows errors and warnings |
| [src/components/common/MenuBuilder/types.ts](src/components/common/MenuBuilder/types.ts) | TypeScript Types | Menu component types | Form data and component interfaces |
| [src/theme/MenuBuilderContext.tsx](src/theme/MenuBuilderContext.tsx) | React Context | Menu builder state | Global state management with reducer |
| [src/utils/menuBuilderTypes.ts](src/utils/menuBuilderTypes.ts) | TypeScript Types | Core data types | MenuItemData, MenuLevelData, MenuSectionData |
| [src/utils/menuBuilderUtils.ts](src/utils/menuBuilderUtils.ts) | TypeScript Utility | Menu utilities | CRUD operations, validation, search |
| [src/utils/menuBuilderNavigation.ts](src/utils/menuBuilderNavigation.ts) | TypeScript Utility | Navigation helpers | Icon registry, route defaults |
| [src/utils/menuInitialization.ts](src/utils/menuInitialization.ts) | TypeScript Utility | Menu initialization | Loads published menu on app start |
| [src/hooks/usePublishedMenu.ts](src/hooks/usePublishedMenu.ts) | React Hook | Consume published menu | AppSidebar uses to get current menu |
| [src/components/common/AppSidebar.tsx](src/components/common/AppSidebar.tsx) | React Component | Application sidebar | Displays menu (uses published config) |

### Shared/Common Files

| File Path | File Type | Purpose | Description |
|-----------|-----------|---------|---|
| [src/components/common/FormControls.tsx](src/components/common/FormControls.tsx) | React Component | Form fields | Input, Select, Textarea, FormField |
| [src/components/app/AppButton.tsx](src/components/app/AppButton.tsx) | React Component | Button component | Styled buttons (primary, outline, etc.) |
| [src/components/app/AppDialog.tsx](src/components/app/AppDialog.tsx) | React Component | Dialog container | Modal/dialog wrapper |
| [src/components/common/ConfirmationDialog.tsx](src/components/common/ConfirmationDialog.tsx) | React Component | Generic confirmation | Reusable confirmation dialog |
| [src/components/common/StatusBadge.tsx](src/components/common/StatusBadge.tsx) | React Component | Status display | Status badge styling |
| [src/components/common/AppShell.tsx](src/components/common/AppShell.tsx) | React Component | App layout wrapper | Header, sidebar, content area |
| [src/components/common/AppTopHeader.tsx](src/components/common/AppTopHeader.tsx) | React Component | Top navigation | Header bar with theme selector |
| [src/utils/classNames.ts](src/utils/classNames.ts) | TypeScript Utility | CSS class utilities | Class name concatenation |
| [src/utils/dateFormat.ts](src/utils/dateFormat.ts) | TypeScript Utility | Date formatting | Format dates for display |
| [src/routes/routeConfig.ts](src/routes/routeConfig.ts) | TypeScript Config | Route paths | All application route paths |
| [src/routes/profileRoutes.tsx](src/routes/profileRoutes.tsx) | React Component | Profile section routes | Routes for profile/settings pages |
| [src/theme/materialTheme.ts](src/theme/materialTheme.ts) | TypeScript Config | Material-UI theme | Base MUI theme configuration |

---

# SECTION 10: FINAL REVIEW CHECKLIST

---

## 10.1 Documentation Completeness Review

| Item | Status | Notes |
|------|--------|-------|
| **Theme Builder Overview** | ✓ Completed | Purpose, benefits, entry point documented |
| **Theme Builder List View** | ✓ Completed | All columns, actions, statuses explained |
| **Theme Builder Create Flow** | ✓ Completed | Step-by-step creation process documented |
| **Theme Builder Form Sections** | ✓ Completed | All sections: Basic, Logo, Colors, Typography, Layout |
| **Color Configuration** | ✓ Completed | Color picker, validation, impact explained |
| **Typography Configuration** | ✓ Completed | Font, size, weight, line height explained |
| **Logo Upload** | ✓ Completed | Upload, validation, removal process documented |
| **Theme Preview** | ✓ Completed | What preview shows, behavior explained |
| **Save Draft** | ✓ Completed | What happens, where themes appear, re-editing |
| **Publish Theme** | ✓ Completed | Validation, consequences, dropdown integration |
| **Deactivate Theme** | ✓ Completed | Purpose, confirmation, user impact |
| **Header Theme Dropdown** | ✓ Completed | Which themes visible, user flow documented |
| **Menu Builder Overview** | ✓ Completed | Purpose, benefits, entry point documented |
| **Menu Builder Main Screen** | ✓ Completed | Layout, sections, preview area explained |
| **Menu Hierarchy** | ✓ Completed | Levels (sections, groups, items) explained |
| **Create Section Flow** | ✓ Completed | Step-by-step documented |
| **Parent Level Selection** | ✓ Completed | Hierarchy relationships explained |
| **Menu Item Management** | ✓ Completed | Adding, editing, moving, deleting items |
| **Drag-and-Drop** | ✓ Completed | How it works, supported scenarios |
| **Live Preview** | ✓ Completed | Desktop/mobile, expandable, read-only |
| **Reset Menu** | ✓ Completed | What it does, confirmation, no live effect |
| **Save Draft (Menu)** | ✓ Completed | Storage, visibility, persistence |
| **Publish Menu** | ✓ Completed | Validation, live update, user experience |
| **Sidebar Update** | ✓ Completed | How changes apply, timing |
| **Common Components** | ✓ Completed | All shared components listed and explained |
| **Form Layout (Theme)** | ✓ Completed | Overall structure, sections, responsive behavior |
| **Form Layout (Menu)** | ✓ Completed | Page structure, tree layout, dialogs |
| **User Journeys** | ✓ Completed | Theme and Menu Builder complete flows |
| **Permissions** | ✓ Partial | Admin roles identified, needs confirmation for specific roles |
| **Business Rules** | ✓ Completed | All rules for both features documented |
| **Error Messages** | ✓ Completed | All validation errors and fixes documented |
| **File Reference** | ✓ Completed | All related files listed with descriptions |
| **Screenshots** | ⚠ Needs Confirmation | Placeholder added for all screens |

---

## 10.2 Content Quality Checklist

| Aspect | Status | Notes |
|--------|--------|-------|
| **Business-User Friendly Language** | ✓ Yes | Avoided technical jargon, used simple terms |
| **Complete Coverage** | ✓ Yes | All screens, dialogs, and features documented |
| **Table Format Usage** | ✓ Yes | Used tables for structure, comparisons, mappings |
| **Screenshot Placeholders** | ✓ Yes | [Insert screenshot...] for every screen |
| **Related Files Listed** | ✓ Yes | File names provided for all sections |
| **Visual Layout Diagrams** | ✓ Yes | ASCII diagrams for complex layouts |
| **Validation Rules** | ✓ Yes | All validation rules documented with errors |
| **User Actions Documented** | ✓ Yes | All buttons, menus, workflows explained |
| **Consequences Explained** | ✓ Yes | What happens after each action |
| **Needs Confirmation Items** | ✓ Yes | Unclear areas marked for team verification |
| **Tone and Formatting** | ✓ Yes | Professional, consistent, scan-able |
| **Examples Provided** | ✓ Yes | Real-world examples throughout |

---

## 10.3 Items Needing Confirmation from Project Team

| Item | Status | Question/Note |
|------|--------|---|
| **Exact Admin Roles** | Needs Confirmation | What are the exact role names? (Admin, Editor, Manager?) |
| **Field-Level Permissions** | Needs Confirmation | Can non-admins edit certain fields? Are sections restricted? |
| **Delete Confirmation** | Needs Confirmation | Does delete show confirmation dialog or is it immediate? |
| **Undo Functionality** | Needs Confirmation | Is Ctrl+Z undo implemented? Can users undo deletions? |
| **Default Menu Structure** | Needs Confirmation | What is the fallback menu if no published config exists? |
| **Circular Reference Prevention** | Needs Confirmation | How exactly is circular nesting prevented? Implementation details? |
| **Theme Auto-Application** | Needs Confirmation | When user selects theme, is it applied immediately or on next load? |
| **Notification Timing** | Needs Confirmation | How long do success messages display (3-5 seconds, user dismiss)? |
| **Mobile Responsiveness** | Needs Confirmation | Specific breakpoints and responsive behaviors confirmed? |
| **Accessibility Features** | Needs Confirmation | WCAG compliance level? Screen reader testing done? |
| **Performance Limits** | Needs Confirmation | Max sections, groups, items supported? Storage limits? |
| **API Integration** | Needs Confirmation | Is this using localStorage only or backend API? |
| **Theme Export/Import** | Needs Confirmation | Can themes be exported as JSON? Imported from file? |
| **Menu Versioning** | Needs Confirmation | Are old versions saved? Can user revert to previous version? |

---

# SECTION 11: MISSING INFORMATION AND OPEN QUESTIONS

---

## 11.1 Missing Information

### Screenshots

**Required Screenshots (Not Yet Captured):**

The following screens need actual screenshots or confirmation that placeholders are acceptable:

1. Theme Builder list page with multiple themes
2. Create new theme form (all sections visible)
3. Color picker dialog
4. Logo upload with preview
5. Typography settings section
6. Theme preview full screen
7. Publish confirmation dialog
8. Menu Builder main page with tree structure
9. Menu form dialog (all types)
10. Menu preview (desktop and mobile views)
11. Validation error messages in forms
12. Success notification messages

### Permissions and Access Control

**Unclear:**
- Exact role names (Admin? Theme Manager? Editor?)
- Field-level permission restrictions
- Can non-admins publish? Only admins?
- Can guest users access these pages?
- Are there department-level restrictions?

### Implementation Details

**Unclear:**
- Default menu structure (what is the fallback?)
- Circular reference prevention mechanism
- Performance limits (max themes, max menu items)
- Storage limits (localStorage capacity)
- API vs. localStorage only
- Version history support

### User Experience

**Unclear:**
- Notification auto-dismiss timing
- Undo/redo support
- Keyboard shortcuts
- Bulk operations (delete multiple items)
- Search within menu structure
- Theme duplication/copying

### Mobile and Responsive Behavior

**Unclear:**
- Specific breakpoints used
- Mobile form layout
- Touch optimization
- Mobile preview appearance

---

## 11.2 Open Questions for Project Team

1. **Can themes be exported as JSON or other format?**
   - Would enable sharing themes between environments

2. **Is there version history for menus or themes?**
   - Can users view/restore previous versions?

3. **Are there API endpoints for themes and menus?**
   - Or is this localStorage-only implementation?

4. **Can multiple users edit simultaneously?**
   - How are conflicts handled?

5. **Are there scheduled/future publish dates?**
   - Can users schedule publication for specific dates?

6. **What happens to users' selected theme when deactivated?**
   - Do they keep the theme styling or forced to switch?

7. **Is there theme inheritance or templating?**
   - Can one theme extend/override another?

8. **Can non-published menu be previewed?**
   - Only in Theme Builder or also shared link?

9. **Are there analytics on theme selection?**
   - Which themes are most popular?

10. **Is there backup/restore functionality?**
    - Can entire theme library or menu be exported/imported?

---

# Final Notes

This documentation provides a comprehensive, business-friendly guide to both the Theme Builder and Menu Builder features. It covers:

✓ Complete user workflows and journeys
✓ All UI components and form layouts
✓ Business rules and validation logic
✓ Error messages and recovery
✓ File references for developers
✓ Permissions and access control
✓ Professional, scan-able formatting
✓ Screenshot placeholders for all screens

**For Implementation and Testing:**
- Use this document to validate feature behavior
- Ensure all error messages match documentation
- Verify user journeys work as described
- Test on desktop and mobile viewports
- Confirm role-based permissions work correctly

**For Support and Training:**
- Share this document with support teams
- Use it as basis for user training materials
- Reference for troubleshooting common issues

**Next Steps:**
1. Get confirmation from project team on open questions
2. Capture actual screenshots for all screens
3. Verify exact role names and permission logic
4. Test all documented workflows
5. Update documentation with confirmed details

---

**Document Status: DRAFT**

*This document should be reviewed by project stakeholders, QA team, and product owners before finalizing. All items marked "Needs Confirmation" should be verified with the development and product teams.*
