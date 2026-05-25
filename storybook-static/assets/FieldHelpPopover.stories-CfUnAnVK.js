import{r as e}from"./chunk-DHx0Hwia.js";import{t}from"./react-Czb5wP2z.js";import{t as n}from"./jsx-runtime-CGsOPcPf.js";var r=e(t(),1),i=n();function a({title:e,description:t,example:n}){let[a,o]=(0,r.useState)(!1),s=(0,r.useRef)(null);return(0,r.useEffect)(()=>{if(!a)return;let e=e=>{e.key===`Escape`&&o(!1)},t=e=>{s.current&&!s.current.contains(e.target)&&o(!1)};return document.addEventListener(`keydown`,e),document.addEventListener(`mousedown`,t),()=>{document.removeEventListener(`keydown`,e),document.removeEventListener(`mousedown`,t)}},[a]),(0,i.jsxs)(`span`,{ref:s,className:`relative inline-flex items-center`,children:[(0,i.jsx)(`button`,{type:`button`,"aria-label":`Help: ${e}`,"aria-expanded":a,onClick:()=>o(e=>!e),className:`ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] transition-colors`,children:`?`}),a&&(0,i.jsxs)(`span`,{role:`tooltip`,className:`absolute left-0 top-7 z-30 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-lg`,children:[(0,i.jsx)(`span`,{className:`block text-sm font-semibold text-[var(--color-text)]`,children:e}),(0,i.jsx)(`span`,{className:`mt-1 block text-sm leading-5 text-[var(--color-text-muted)]`,children:t}),n&&(0,i.jsxs)(`span`,{className:`mt-2 block rounded-lg bg-[var(--color-surface-subtle)] p-2 text-xs text-[var(--color-text-muted)]`,children:[(0,i.jsx)(`span`,{className:`font-medium text-[var(--color-text)]`,children:`Example: `}),n]})]})]})}a.__docgenInfo={description:`FieldHelpPopover — a small inline "?" button that opens a contextual\r
explanation popover next to a complex form field.\r
\r
Use only for fields that genuinely need explanation (regex, attachment rules,\r
entity type, series type, etc.). Do not add to every field.`,methods:[],displayName:`FieldHelpPopover`,props:{title:{required:!0,tsType:{name:`string`},description:`Short label for the field — shown as the popover heading.`},description:{required:!0,tsType:{name:`string`},description:`Clear explanation of what the field means and when to use it.`},example:{required:!1,tsType:{name:`string`},description:`Optional concrete example shown in a highlighted block.`}}};var o={title:`Experience/FieldHelpPopover`,component:a,parameters:{layout:`centered`}},s={name:`Code Prefix field help`,args:{title:`Code Prefix`,description:`A short alphabetic code prepended to all generated document numbers for this entity type. The prefix distinguishes document series and appears in all references and reports.`,example:`PO for Purchase Orders, SO for Sale Orders, GRN for Goods Receipt Notes`}},c={name:`Series Type field help`,args:{title:`Series Type`,description:`Controls how the numeric portion of the document code resets. Annual resets the counter at the start of each financial year. Perpetual never resets — the counter continues indefinitely.`,example:`Annual: PO-2526-00001, PO-2627-00001 | Perpetual: PO-00001, PO-00002`}},l={name:`Entity Type field help`,args:{title:`Entity Type`,description:`The category of business party this KYC configuration applies to. Each entity type can have a different set of required proof documents per country.`,example:`Customer, Supplier, Employee, Vendor, Partner`}},u={name:`GST Number field help — no example`,args:{title:`GST Number`,description:`The Goods and Services Tax identification number issued by the tax authority. Required for tax-registered entities operating in India. This number appears on all tax invoices and GST returns.`}},d={name:`Picklist Level field help`,args:{title:`Picklist Level`,description:`Defines the hierarchy position of this picklist within a dependent selection chain. Level 1 is the top-level parent. Level 2 items filter based on the selected Level 1 value.`,example:`Level 1: State → Level 2: District → Level 3: City`}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'Code Prefix field help',
  args: {
    title: 'Code Prefix',
    description: 'A short alphabetic code prepended to all generated document numbers for this entity type. ' + 'The prefix distinguishes document series and appears in all references and reports.',
    example: 'PO for Purchase Orders, SO for Sale Orders, GRN for Goods Receipt Notes'
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: 'Series Type field help',
  args: {
    title: 'Series Type',
    description: 'Controls how the numeric portion of the document code resets. ' + 'Annual resets the counter at the start of each financial year. ' + 'Perpetual never resets — the counter continues indefinitely.',
    example: 'Annual: PO-2526-00001, PO-2627-00001 | Perpetual: PO-00001, PO-00002'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'Entity Type field help',
  args: {
    title: 'Entity Type',
    description: 'The category of business party this KYC configuration applies to. ' + 'Each entity type can have a different set of required proof documents per country.',
    example: 'Customer, Supplier, Employee, Vendor, Partner'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: 'GST Number field help — no example',
  args: {
    title: 'GST Number',
    description: 'The Goods and Services Tax identification number issued by the tax authority. ' + 'Required for tax-registered entities operating in India. ' + 'This number appears on all tax invoices and GST returns.'
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: 'Picklist Level field help',
  args: {
    title: 'Picklist Level',
    description: 'Defines the hierarchy position of this picklist within a dependent selection chain. ' + 'Level 1 is the top-level parent. Level 2 items filter based on the selected Level 1 value.',
    example: 'Level 1: State → Level 2: District → Level 3: City'
  }
}`,...d.parameters?.docs?.source}}};var f=[`CodePrefix`,`SeriesType`,`EntityType`,`GstNumber`,`PicklistLevel`];export{s as CodePrefix,l as EntityType,u as GstNumber,d as PicklistLevel,c as SeriesType,f as __namedExportsOrder,o as default};