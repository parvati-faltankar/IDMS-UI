import{t as e}from"./jsx-runtime-CGsOPcPf.js";var t=e();function n({title:e,description:n,primaryActionLabel:r,onPrimaryAction:i,secondaryActionLabel:a,onSecondaryAction:o,compact:s=!1}){return(0,t.jsxs)(`div`,{className:[`rounded-2xl border border-dashed border-[var(--color-border)]`,`bg-[var(--color-surface)] text-center`,s?`p-5`:`p-8`].join(` `),children:[(0,t.jsx)(`div`,{className:[`mx-auto mb-4 flex items-center justify-center rounded-2xl`,`bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]`,s?`h-9 w-9 text-base`:`h-12 w-12 text-xl`].join(` `),"aria-hidden":`true`,children:`✦`}),(0,t.jsx)(`h3`,{className:[`font-semibold text-[var(--color-text)]`,s?`text-sm`:`text-base`].join(` `),children:e}),(0,t.jsx)(`p`,{className:[`mx-auto mt-2 max-w-xl leading-6 text-[var(--color-text-muted)]`,s?`text-xs`:`text-sm`].join(` `),children:n}),(r||a)&&(0,t.jsxs)(`div`,{className:[`flex flex-wrap justify-center gap-2`,s?`mt-4`:`mt-5`].join(` `),children:[a&&(0,t.jsx)(`button`,{type:`button`,onClick:o,className:`rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors`,children:a}),r&&(0,t.jsx)(`button`,{type:`button`,onClick:i,className:`rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-[var(--color-primary-contrast)] hover:opacity-90 transition-opacity`,children:r})]})]})}n.__docgenInfo={description:`EmptyStateGuide — shown when a list, panel, or section has no data yet.\r
\r
Use to communicate what is empty, why it matters, and what the user should\r
do next. Supports an optional compact mode for use inside section tabs.\r
\r
Do not use as a loading skeleton or error state — use dedicated components\r
for those cases.`,methods:[],displayName:`EmptyStateGuide`,props:{title:{required:!0,tsType:{name:`string`},description:`Primary heading — one short phrase describing what is empty.`},description:{required:!0,tsType:{name:`string`},description:`Supporting text — explain what to do or why nothing is here.`},primaryActionLabel:{required:!1,tsType:{name:`string`},description:`Label for the primary call-to-action button.`},onPrimaryAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},secondaryActionLabel:{required:!1,tsType:{name:`string`},description:`Label for the secondary (ghost) action button.`},onSecondaryAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},compact:{required:!1,tsType:{name:`boolean`},description:`Compact mode — reduces padding and icon size for use inside panels or\r
section tabs where vertical space is limited.`,defaultValue:{value:`false`,computed:!1}}}};var r={title:`Experience/EmptyStateGuide`,component:n,parameters:{layout:`padded`},tags:[`autodocs`]},i={name:`Default — KYC proof rules empty`,args:{title:`No proof rules configured`,description:`Add at least one active proof rule before activating this KYC configuration. Each rule defines a required document type per country and entity type.`,primaryActionLabel:`Add proof rule`,secondaryActionLabel:`How this works`,onPrimaryAction:()=>console.log(`Add proof rule`),onSecondaryAction:()=>console.log(`Open help`)}},a={name:`First use — nothing configured`,args:{title:`No picklist values yet`,description:`Picklist values define the dropdown options available across transaction forms. Start by adding values for the most commonly used fields such as Payment Terms and Delivery Mode.`,primaryActionLabel:`Add first value`,onPrimaryAction:()=>console.log(`Add value`)}},o={name:`Section empty — branches not added`,args:{title:`No branches configured`,description:`The organisation master requires at least one branch location before it can be activated. Branches are used to assign inventory sites, documents, and reporting regions.`,primaryActionLabel:`Add branch`,secondaryActionLabel:`Learn about branches`,onPrimaryAction:()=>console.log(`Add branch`),onSecondaryAction:()=>console.log(`Open help`)}},s={name:`Read-only — no actions available`,args:{title:`No numbering prefixes defined`,description:`Numbering prefixes have not been configured for this document type. Contact your system administrator to define the prefix before creating documents.`}},c={name:`Compact — inside section panel`,args:{title:`No verification rules`,description:`Verification mode has not been set. Select a mode to continue.`,primaryActionLabel:`Set verification mode`,onPrimaryAction:()=>console.log(`Set mode`),compact:!0}},l={name:`With both actions — currency master`,args:{title:`No currencies added`,description:`Add the currencies your organisation transacts in. The base currency is used for all reporting and must be set first.`,primaryActionLabel:`Add currency`,secondaryActionLabel:`View currency guide`,onPrimaryAction:()=>console.log(`Add currency`),onSecondaryAction:()=>console.log(`Open help`)}},u={name:`Minimal — description only`,args:{title:`No change history`,description:`Changes to this configuration will appear here after the first save.`}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: 'Default — KYC proof rules empty',
  args: {
    title: 'No proof rules configured',
    description: 'Add at least one active proof rule before activating this KYC configuration. ' + 'Each rule defines a required document type per country and entity type.',
    primaryActionLabel: 'Add proof rule',
    secondaryActionLabel: 'How this works',
    onPrimaryAction: () => console.log('Add proof rule'),
    onSecondaryAction: () => console.log('Open help')
  }
}`,...i.parameters?.docs?.source},description:{story:`Default — proof rules section is empty, user needs to act.`,...i.parameters?.docs?.description}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'First use — nothing configured',
  args: {
    title: 'No picklist values yet',
    description: 'Picklist values define the dropdown options available across transaction forms. ' + 'Start by adding values for the most commonly used fields such as Payment Terms and Delivery Mode.',
    primaryActionLabel: 'Add first value',
    onPrimaryAction: () => console.log('Add value')
  }
}`,...a.parameters?.docs?.source},description:{story:`First-use — fresh install, nothing configured at all.`,...a.parameters?.docs?.description}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: 'Section empty — branches not added',
  args: {
    title: 'No branches configured',
    description: 'The organisation master requires at least one branch location before it can be activated. ' + 'Branches are used to assign inventory sites, documents, and reporting regions.',
    primaryActionLabel: 'Add branch',
    secondaryActionLabel: 'Learn about branches',
    onPrimaryAction: () => console.log('Add branch'),
    onSecondaryAction: () => console.log('Open help')
  }
}`,...o.parameters?.docs?.source},description:{story:`In-progress — section has data elsewhere but this sub-section is empty.`,...o.parameters?.docs?.description}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'Read-only — no actions available',
  args: {
    title: 'No numbering prefixes defined',
    description: 'Numbering prefixes have not been configured for this document type. ' + 'Contact your system administrator to define the prefix before creating documents.'
  }
}`,...s.parameters?.docs?.source},description:{story:`Read-only / locked — user cannot add anything in this state.`,...s.parameters?.docs?.description}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: 'Compact — inside section panel',
  args: {
    title: 'No verification rules',
    description: 'Verification mode has not been set. Select a mode to continue.',
    primaryActionLabel: 'Set verification mode',
    onPrimaryAction: () => console.log('Set mode'),
    compact: true
  }
}`,...c.parameters?.docs?.source},description:{story:`Compact — used inside section tabs with limited vertical space.`,...c.parameters?.docs?.description}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'With both actions — currency master',
  args: {
    title: 'No currencies added',
    description: 'Add the currencies your organisation transacts in. ' + 'The base currency is used for all reporting and must be set first.',
    primaryActionLabel: 'Add currency',
    secondaryActionLabel: 'View currency guide',
    onPrimaryAction: () => console.log('Add currency'),
    onSecondaryAction: () => console.log('Open help')
  }
}`,...l.parameters?.docs?.source},description:{story:`With both actions — primary CTA and a contextual help link.`,...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: 'Minimal — description only',
  args: {
    title: 'No change history',
    description: 'Changes to this configuration will appear here after the first save.'
  }
}`,...u.parameters?.docs?.source},description:{story:`Minimal — title and description only, no actions.`,...u.parameters?.docs?.description}}};var d=[`Default`,`FreshInstall`,`SectionEmpty`,`ReadOnly`,`Compact`,`WithBothActions`,`Minimal`];export{c as Compact,i as Default,a as FreshInstall,u as Minimal,s as ReadOnly,o as SectionEmpty,l as WithBothActions,d as __namedExportsOrder,r as default};