import{t as e}from"./jsx-runtime-CGsOPcPf.js";var t=e(),n={complete:`Complete`,"in-progress":`In progress`,"not-started":`Not started`,"needs-attention":`Needs attention`},r={complete:{borderColor:`color-mix(in srgb, #10b981 35%, var(--color-border))`,background:`color-mix(in srgb, #10b981 12%, var(--color-surface))`,color:`color-mix(in srgb, #10b981 85%, var(--color-text))`},"in-progress":{borderColor:`color-mix(in srgb, #3b82f6 35%, var(--color-border))`,background:`color-mix(in srgb, #3b82f6 10%, var(--color-surface))`,color:`color-mix(in srgb, #3b82f6 85%, var(--color-text))`},"not-started":{borderColor:`var(--color-border)`,background:`var(--color-surface-subtle)`,color:`var(--color-text-muted)`},"needs-attention":{borderColor:`color-mix(in srgb, #f59e0b 35%, var(--color-border))`,background:`color-mix(in srgb, #f59e0b 10%, var(--color-surface))`,color:`color-mix(in srgb, #f59e0b 80%, var(--color-text))`}};function i(e){if(e.length===0)return 0;let t=e.filter(e=>e.status===`complete`).length;return Math.round(t/e.length*100)}function a(e){return e.find(e=>e.status===`needs-attention`)??e.find(e=>e.status===`in-progress`)??e.find(e=>e.status===`not-started`)}function o({title:e=`Admin setup assistant`,description:o=`Complete the essential setup areas before users begin transaction work.`,items:s,onOpenItem:c}){let l=i(s),u=a(s);return(0,t.jsxs)(`section`,{className:`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm`,children:[(0,t.jsxs)(`div`,{className:`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`,children:[(0,t.jsxs)(`div`,{children:[(0,t.jsx)(`h2`,{className:`text-lg font-semibold text-[var(--color-text)]`,children:e}),(0,t.jsx)(`p`,{className:`mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]`,children:o})]}),(0,t.jsxs)(`div`,{className:`min-w-40 rounded-xl bg-[var(--color-surface-subtle)] p-3 text-center`,children:[(0,t.jsxs)(`div`,{className:`text-2xl font-semibold text-[var(--color-text)]`,children:[l,`%`]}),(0,t.jsx)(`div`,{className:`text-xs text-[var(--color-text-muted)]`,children:`setup complete`})]})]}),(0,t.jsx)(`div`,{className:`mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]`,children:(0,t.jsx)(`div`,{className:`h-full rounded-full bg-[var(--color-primary)] transition-all`,style:{width:`${l}%`}})}),u&&(0,t.jsxs)(`div`,{className:`mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4`,children:[(0,t.jsx)(`p`,{className:`text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]`,children:`Recommended next`}),(0,t.jsxs)(`div`,{className:`mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between`,children:[(0,t.jsxs)(`div`,{children:[(0,t.jsx)(`p`,{className:`text-sm font-semibold text-[var(--color-text)]`,children:u.label}),(0,t.jsx)(`p`,{className:`text-sm text-[var(--color-text-muted)]`,children:u.description})]}),c&&(0,t.jsx)(`button`,{type:`button`,onClick:()=>c(u),className:`rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90`,children:`Continue`})]})]}),(0,t.jsx)(`div`,{className:`mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3`,children:s.map(e=>(0,t.jsxs)(`button`,{type:`button`,onClick:()=>c?.(e),className:`rounded-xl border border-[var(--color-border)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm`,children:[(0,t.jsxs)(`div`,{className:`flex items-start justify-between gap-3`,children:[(0,t.jsx)(`p`,{className:`text-sm font-semibold text-[var(--color-text)]`,children:e.label}),(0,t.jsx)(`span`,{className:`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium`,style:r[e.status],children:n[e.status]})]}),(0,t.jsx)(`p`,{className:`mt-2 text-sm leading-5 text-[var(--color-text-muted)]`,children:e.description})]},e.id))})]})}o.__docgenInfo={description:``,methods:[],displayName:`AdminSetupAssistant`,props:{title:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`'Admin setup assistant'`,computed:!1}},description:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`'Complete the essential setup areas before users begin transaction work.'`,computed:!1}},items:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{\r
  id: string;\r
  label: string;\r
  description: string;\r
  status: AdminSetupStatus;\r
  path?: string;\r
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`description`,value:{name:`string`,required:!0}},{key:`status`,value:{name:`union`,raw:`'complete' | 'in-progress' | 'not-started' | 'needs-attention'`,elements:[{name:`literal`,value:`'complete'`},{name:`literal`,value:`'in-progress'`},{name:`literal`,value:`'not-started'`},{name:`literal`,value:`'needs-attention'`}],required:!0}},{key:`path`,value:{name:`string`,required:!1}}]}}],raw:`AdminSetupItem[]`},description:``},onOpenItem:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(item: AdminSetupItem) => void`,signature:{arguments:[{type:{name:`signature`,type:`object`,raw:`{\r
  id: string;\r
  label: string;\r
  description: string;\r
  status: AdminSetupStatus;\r
  path?: string;\r
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`description`,value:{name:`string`,required:!0}},{key:`status`,value:{name:`union`,raw:`'complete' | 'in-progress' | 'not-started' | 'needs-attention'`,elements:[{name:`literal`,value:`'complete'`},{name:`literal`,value:`'in-progress'`},{name:`literal`,value:`'not-started'`},{name:`literal`,value:`'needs-attention'`}],required:!0}},{key:`path`,value:{name:`string`,required:!1}}]}},name:`item`}],return:{name:`void`}}},description:``}}};var s=[{id:`organisation-master`,label:`Organisation Master`,description:`Configure legal entity, branches, tax identifiers, and branding assets.`,status:`complete`,path:`/admin/master/organisation-master`},{id:`numbering-code-setup`,label:`Numbering & Code Setup`,description:`Define document number sequences and code prefixes before users create records.`,status:`complete`,path:`/admin/master/numbering-code-setup`},{id:`picklist-master`,label:`Picklist Master`,description:`Prepare dropdown values and dependent selections used across transaction forms.`,status:`in-progress`,path:`/admin/master/picklist-master`},{id:`kyc-setup`,label:`KYC Setup`,description:`Set country-wise document verification requirements for parties and employees.`,status:`not-started`,path:`/admin/master/kyc-setup`},{id:`code-generation-policy`,label:`Code Generation Policy`,description:`Configure rules for automatic code and ID generation across entity types.`,status:`not-started`,path:`/admin/master/code-generation-policy`}],c={title:`Experience/AdminSetupAssistant`,component:o,parameters:{layout:`padded`}},l={name:`Default — setup in progress`,args:{title:`Admin setup assistant`,description:`Complete the essential setup areas before users begin transaction work.`,items:s,onOpenItem:e=>console.log(`Open item:`,e.id)}},u={name:`Fresh install — nothing started`,args:{title:`Admin setup assistant`,description:`Nothing has been configured yet. Start with Organisation Master.`,items:s.map(e=>({...e,status:`not-started`})),onOpenItem:e=>console.log(`Open item:`,e.id)}},d={name:`All complete — ready to activate`,args:{title:`Admin setup assistant`,description:`All setup areas are complete. You can now activate the configuration.`,items:s.map(e=>({...e,status:`complete`})),onOpenItem:e=>console.log(`Open item:`,e.id)}},f={name:`Needs attention — blockers present`,args:{title:`Admin setup assistant`,description:`Some areas need your attention before the setup can be activated.`,items:[{...s[0],status:`complete`},{...s[1],status:`needs-attention`},{...s[2],status:`needs-attention`},{...s[3],status:`in-progress`},{...s[4],status:`not-started`}],onOpenItem:e=>console.log(`Open item:`,e.id)}},p={name:`Minimal — two items only`,args:{title:`Quick setup`,description:`Configure these two items to get started.`,items:[{id:`org`,label:`Organisation Master`,description:`Legal entity name, GST number, and primary address.`,status:`complete`,path:`/admin/master/organisation-master`},{id:`numbering`,label:`Numbering Setup`,description:`Document number sequences and prefix format.`,status:`in-progress`,path:`/admin/master/numbering-code-setup`}],onOpenItem:e=>console.log(`Open item:`,e.id)}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'Default — setup in progress',
  args: {
    title: 'Admin setup assistant',
    description: 'Complete the essential setup areas before users begin transaction work.',
    items: FULL_SETUP_ITEMS,
    onOpenItem: item => console.log('Open item:', item.id)
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: 'Fresh install — nothing started',
  args: {
    title: 'Admin setup assistant',
    description: 'Nothing has been configured yet. Start with Organisation Master.',
    items: FULL_SETUP_ITEMS.map(item => ({
      ...item,
      status: 'not-started' as const
    })),
    onOpenItem: item => console.log('Open item:', item.id)
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: 'All complete — ready to activate',
  args: {
    title: 'Admin setup assistant',
    description: 'All setup areas are complete. You can now activate the configuration.',
    items: FULL_SETUP_ITEMS.map(item => ({
      ...item,
      status: 'complete' as const
    })),
    onOpenItem: item => console.log('Open item:', item.id)
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: 'Needs attention — blockers present',
  args: {
    title: 'Admin setup assistant',
    description: 'Some areas need your attention before the setup can be activated.',
    items: [{
      ...FULL_SETUP_ITEMS[0],
      status: 'complete'
    }, {
      ...FULL_SETUP_ITEMS[1],
      status: 'needs-attention'
    }, {
      ...FULL_SETUP_ITEMS[2],
      status: 'needs-attention'
    }, {
      ...FULL_SETUP_ITEMS[3],
      status: 'in-progress'
    }, {
      ...FULL_SETUP_ITEMS[4],
      status: 'not-started'
    }],
    onOpenItem: item => console.log('Open item:', item.id)
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: 'Minimal — two items only',
  args: {
    title: 'Quick setup',
    description: 'Configure these two items to get started.',
    items: [{
      id: 'org',
      label: 'Organisation Master',
      description: 'Legal entity name, GST number, and primary address.',
      status: 'complete',
      path: '/admin/master/organisation-master'
    }, {
      id: 'numbering',
      label: 'Numbering Setup',
      description: 'Document number sequences and prefix format.',
      status: 'in-progress',
      path: '/admin/master/numbering-code-setup'
    }],
    onOpenItem: item => console.log('Open item:', item.id)
  }
}`,...p.parameters?.docs?.source}}};var m=[`Default`,`FreshInstall`,`AllComplete`,`NeedsAttention`,`MinimalItems`];export{d as AllComplete,l as Default,u as FreshInstall,p as MinimalItems,f as NeedsAttention,m as __namedExportsOrder,c as default};