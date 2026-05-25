import{t as e}from"./jsx-runtime-CGsOPcPf.js";var t=e();function n(e=`neutral`){return e===`active`?{borderColor:`color-mix(in srgb, #10b981 35%, var(--color-border))`,background:`color-mix(in srgb, #10b981 12%, var(--color-surface))`,color:`color-mix(in srgb, #10b981 85%, var(--color-text))`}:e===`draft`?{borderColor:`var(--color-border)`,background:`var(--color-surface-subtle)`,color:`var(--color-text-muted)`}:e===`warning`?{borderColor:`color-mix(in srgb, #f59e0b 35%, var(--color-border))`,background:`color-mix(in srgb, #f59e0b 10%, var(--color-surface))`,color:`color-mix(in srgb, #f59e0b 80%, var(--color-text))`}:e===`danger`?{borderColor:`color-mix(in srgb, var(--color-danger) 35%, var(--color-border))`,background:`color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))`,color:`var(--color-danger)`}:{borderColor:`var(--color-border)`,background:`var(--color-surface)`,color:`var(--color-text-muted)`}}function r(e=`secondary`){return e===`primary`?`bg-[var(--color-primary)] text-white border-transparent hover:opacity-90`:e===`ghost`?`border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]`:`border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]`}function i({action:e}){let n=`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${r(e.tone)}`;return e.href?(0,t.jsx)(`a`,{href:e.href,className:n,children:e.label}):(0,t.jsx)(`button`,{type:`button`,onClick:e.onClick,className:n,children:e.label})}function a({title:e,description:r,breadcrumbs:a=[],statusLabel:o,statusTone:s=`neutral`,primaryAction:c,secondaryActions:l=[],helpTopicId:u,onHelpClick:d}){return(0,t.jsxs)(`header`,{className:`mb-6 border-b border-[var(--color-border)] pb-5`,children:[a.length>0&&(0,t.jsx)(`nav`,{"aria-label":`Breadcrumb`,className:`mb-2 text-sm text-[var(--color-text-muted)]`,children:a.map((e,n)=>(0,t.jsxs)(`span`,{children:[n>0&&(0,t.jsx)(`span`,{className:`mx-2`,children:`/`}),(0,t.jsx)(`span`,{children:e})]},`${e}-${n}`))}),(0,t.jsxs)(`div`,{className:`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`,children:[(0,t.jsxs)(`div`,{className:`min-w-0`,children:[(0,t.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,t.jsx)(`h1`,{className:`text-2xl font-semibold tracking-tight text-[var(--color-text)]`,children:e}),o&&(0,t.jsx)(`span`,{className:`rounded-full border px-2.5 py-1 text-xs font-medium`,style:n(s),children:o})]}),r&&(0,t.jsx)(`p`,{className:`mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]`,children:r})]}),(0,t.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[u&&d&&(0,t.jsx)(`button`,{type:`button`,onClick:()=>d(u),className:`rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]`,children:`How this works`}),l.map(e=>(0,t.jsx)(i,{action:e},e.label)),c&&(0,t.jsx)(i,{action:{...c,tone:c.tone??`primary`}})]})]})]})}a.__docgenInfo={description:``,methods:[],displayName:`PageHeader`,props:{title:{required:!0,tsType:{name:`string`},description:``},description:{required:!1,tsType:{name:`string`},description:``},breadcrumbs:{required:!1,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``,defaultValue:{value:`[]`,computed:!1}},statusLabel:{required:!1,tsType:{name:`string`},description:``},statusTone:{required:!1,tsType:{name:`union`,raw:`'neutral' | 'draft' | 'active' | 'warning' | 'danger'`,elements:[{name:`literal`,value:`'neutral'`},{name:`literal`,value:`'draft'`},{name:`literal`,value:`'active'`},{name:`literal`,value:`'warning'`},{name:`literal`,value:`'danger'`}]},description:``,defaultValue:{value:`'neutral'`,computed:!1}},primaryAction:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{\r
  label: string;\r
  onClick?: () => void;\r
  href?: string;\r
  tone?: 'primary' | 'secondary' | 'ghost';\r
}`,signature:{properties:[{key:`label`,value:{name:`string`,required:!0}},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!1}},{key:`href`,value:{name:`string`,required:!1}},{key:`tone`,value:{name:`union`,raw:`'primary' | 'secondary' | 'ghost'`,elements:[{name:`literal`,value:`'primary'`},{name:`literal`,value:`'secondary'`},{name:`literal`,value:`'ghost'`}],required:!1}}]}},description:``},secondaryActions:{required:!1,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{\r
  label: string;\r
  onClick?: () => void;\r
  href?: string;\r
  tone?: 'primary' | 'secondary' | 'ghost';\r
}`,signature:{properties:[{key:`label`,value:{name:`string`,required:!0}},{key:`onClick`,value:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}},required:!1}},{key:`href`,value:{name:`string`,required:!1}},{key:`tone`,value:{name:`union`,raw:`'primary' | 'secondary' | 'ghost'`,elements:[{name:`literal`,value:`'primary'`},{name:`literal`,value:`'secondary'`},{name:`literal`,value:`'ghost'`}],required:!1}}]}}],raw:`PageHeaderAction[]`},description:``,defaultValue:{value:`[]`,computed:!1}},helpTopicId:{required:!1,tsType:{name:`string`},description:``},onHelpClick:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(topicId: string) => void`,signature:{arguments:[{type:{name:`string`},name:`topicId`}],return:{name:`void`}}},description:``}}};var o={title:`Experience/PageHeader`,component:a,parameters:{layout:`padded`}},s={name:`Title only`,args:{title:`Organisation Master`}},c={name:`With description`,args:{title:`KYC Setup`,description:`Configure proof document requirements by entity type and country.`}},l={name:`With breadcrumbs`,args:{title:`KYC Setup`,description:`Configure proof document requirements by entity type and country.`,breadcrumbs:[`Admin`,`Masters`,`KYC Setup`]}},u={name:`Active status badge`,args:{title:`Organisation Master`,description:`Legal entity and branch configuration.`,breadcrumbs:[`Admin`,`Masters`],statusLabel:`Active`,statusTone:`active`}},d={name:`Draft status badge`,args:{title:`Code Generation Policy`,description:`Automatic ID generation rules for all entity types.`,breadcrumbs:[`Admin`,`Masters`],statusLabel:`Draft`,statusTone:`draft`}},f={name:`Warning status — attention needed`,args:{title:`Picklist Master`,description:`Manage dropdown values and enumeration options.`,breadcrumbs:[`Admin`,`Masters`],statusLabel:`Needs attention`,statusTone:`warning`}},p={name:`Danger status — blocked`,args:{title:`Code Generation Policy`,description:`Automatic ID generation rules for all entity types.`,breadcrumbs:[`Admin`,`Masters`],statusLabel:`Blocked`,statusTone:`danger`}},m={name:`Neutral status — inactive`,args:{title:`Tax Master`,description:`GST slabs, TDS, and other tax registrations.`,breadcrumbs:[`Admin`,`Finance`],statusLabel:`Inactive`,statusTone:`neutral`}},h={name:`With primary action`,args:{title:`KYC Setup`,description:`Configure proof document requirements by entity type and country.`,breadcrumbs:[`Admin`,`Masters`],statusLabel:`Draft`,statusTone:`draft`,primaryAction:{label:`Activate`,tone:`primary`,onClick:()=>{}}}},g={name:`Full featured — breadcrumbs, status, and actions`,args:{title:`Organisation Master`,description:`Configure the legal entity, branch locations, tax identifiers, and branding assets.`,breadcrumbs:[`Admin`,`Masters`,`Organisation Master`],statusLabel:`Active`,statusTone:`active`,primaryAction:{label:`Edit`,tone:`primary`,onClick:()=>{}},secondaryActions:[{label:`View History`,tone:`secondary`,onClick:()=>{}},{label:`Help`,tone:`ghost`,onClick:()=>{}}],helpTopicId:`organisation-master`,onHelpClick:e=>console.log(`Help clicked:`,e)}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'Title only',
  args: {
    title: 'Organisation Master'
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: 'With description',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'With breadcrumbs',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
    breadcrumbs: ['Admin', 'Masters', 'KYC Setup']
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: 'Active status badge',
  args: {
    title: 'Organisation Master',
    description: 'Legal entity and branch configuration.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Active',
    statusTone: 'active'
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: 'Draft status badge',
  args: {
    title: 'Code Generation Policy',
    description: 'Automatic ID generation rules for all entity types.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Draft',
    statusTone: 'draft'
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: 'Warning status — attention needed',
  args: {
    title: 'Picklist Master',
    description: 'Manage dropdown values and enumeration options.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Needs attention',
    statusTone: 'warning'
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: 'Danger status — blocked',
  args: {
    title: 'Code Generation Policy',
    description: 'Automatic ID generation rules for all entity types.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Blocked',
    statusTone: 'danger'
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: 'Neutral status — inactive',
  args: {
    title: 'Tax Master',
    description: 'GST slabs, TDS, and other tax registrations.',
    breadcrumbs: ['Admin', 'Finance'],
    statusLabel: 'Inactive',
    statusTone: 'neutral'
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: 'With primary action',
  args: {
    title: 'KYC Setup',
    description: 'Configure proof document requirements by entity type and country.',
    breadcrumbs: ['Admin', 'Masters'],
    statusLabel: 'Draft',
    statusTone: 'draft',
    primaryAction: {
      label: 'Activate',
      tone: 'primary',
      onClick: () => {}
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: 'Full featured — breadcrumbs, status, and actions',
  args: {
    title: 'Organisation Master',
    description: 'Configure the legal entity, branch locations, tax identifiers, and branding assets.',
    breadcrumbs: ['Admin', 'Masters', 'Organisation Master'],
    statusLabel: 'Active',
    statusTone: 'active',
    primaryAction: {
      label: 'Edit',
      tone: 'primary',
      onClick: () => {}
    },
    secondaryActions: [{
      label: 'View History',
      tone: 'secondary',
      onClick: () => {}
    }, {
      label: 'Help',
      tone: 'ghost',
      onClick: () => {}
    }],
    helpTopicId: 'organisation-master',
    onHelpClick: id => console.log('Help clicked:', id)
  }
}`,...g.parameters?.docs?.source}}};var _=[`TitleOnly`,`WithDescription`,`WithBreadcrumbs`,`ActiveStatus`,`DraftStatus`,`WarningStatus`,`DangerStatus`,`NeutralStatus`,`WithPrimaryAction`,`FullFeatured`];export{u as ActiveStatus,p as DangerStatus,d as DraftStatus,g as FullFeatured,m as NeutralStatus,s as TitleOnly,f as WarningStatus,l as WithBreadcrumbs,c as WithDescription,h as WithPrimaryAction,_ as __namedExportsOrder,o as default};