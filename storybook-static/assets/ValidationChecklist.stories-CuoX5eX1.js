import{t as e}from"./jsx-runtime-CGsOPcPf.js";import{t}from"./createLucideIcon-D1tQE2hF.js";import{n,t as r}from"./circle-check-CJipdeaI.js";import{t as i}from"./x-BhBRlF7c.js";var a=t(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),o=e();function s({item:e,onNavigate:t}){let r=e.status===`ok`,s=!!t&&!!e.sectionKey;return(0,o.jsxs)(`div`,{style:{border:`1px solid ${r?`color-mix(in srgb, #10b981 35%, var(--color-border))`:`color-mix(in srgb, var(--color-danger) 35%, var(--color-border))`}`,borderRadius:`10px`,overflow:`hidden`,cursor:s?`pointer`:`default`,transition:`box-shadow 0.15s`},onClick:()=>s&&t(e.sectionKey),title:s?`Go to ${e.sectionKey}`:void 0,children:[(0,o.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`,padding:`12px 16px`,background:r?`color-mix(in srgb, #10b981 10%, var(--color-surface))`:`color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))`},children:[(0,o.jsx)(`div`,{style:{width:`28px`,height:`28px`,borderRadius:`50%`,background:r?`color-mix(in srgb, #10b981 20%, var(--color-surface))`:`color-mix(in srgb, var(--color-danger) 18%, var(--color-surface))`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0},children:r?(0,o.jsx)(a,{size:14,style:{color:`color-mix(in srgb, #10b981 90%, var(--color-text))`}}):(0,o.jsx)(i,{size:14,style:{color:`var(--color-danger)`}})}),(0,o.jsxs)(`div`,{style:{flex:1,minWidth:0},children:[(0,o.jsx)(`div`,{style:{fontSize:`13px`,fontWeight:600,color:r?`color-mix(in srgb, #10b981 85%, var(--color-text))`:`var(--color-danger)`},children:e.label}),(0,o.jsx)(`div`,{style:{fontSize:`11px`,color:r?`color-mix(in srgb, #10b981 70%, var(--color-text-muted))`:`color-mix(in srgb, var(--color-danger) 75%, var(--color-text-muted))`,marginTop:`2px`},children:e.detail})]}),s&&(0,o.jsx)(n,{size:14,style:{color:r?`color-mix(in srgb, #10b981 70%, var(--color-text-muted))`:`color-mix(in srgb, var(--color-danger) 70%, var(--color-text-muted))`,flexShrink:0}})]}),(e.errors?.length??0)>0&&(0,o.jsx)(`div`,{style:{padding:`8px 16px 10px 56px`,background:`color-mix(in srgb, var(--color-danger) 6%, var(--color-surface))`,borderTop:`1px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-border))`},children:(0,o.jsx)(`ul`,{style:{margin:0,paddingLeft:`14px`},children:e.errors.map((e,t)=>(0,o.jsx)(`li`,{style:{fontSize:`11px`,color:`color-mix(in srgb, var(--color-danger) 80%, var(--color-text))`,marginBottom:`2px`,lineHeight:1.4},children:e},t))})})]})}function c({items:e,onNavigateToSection:t,canActivate:n=!1,isReadOnly:i=!1,onActivate:a}){let c=e.filter(e=>e.status===`ok`).length,l=c===e.length;return(0,o.jsxs)(`div`,{children:[(0,o.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`10px`,marginBottom:`20px`},children:e.map(e=>(0,o.jsx)(s,{item:e,onNavigate:t},e.key))}),(0,o.jsxs)(`div`,{style:{padding:`16px 20px`,borderRadius:`12px`,background:l?`color-mix(in srgb, #10b981 10%, var(--color-surface))`:`var(--color-surface-subtle)`,border:`1px solid ${l?`color-mix(in srgb, #10b981 35%, var(--color-border))`:`var(--color-border)`}`,display:`flex`,alignItems:`center`,gap:`16px`},children:[(0,o.jsxs)(`div`,{style:{flex:1},children:[(0,o.jsx)(`div`,{style:{fontSize:`13px`,fontWeight:700,color:l?`color-mix(in srgb, #10b981 85%, var(--color-text))`:`var(--color-text)`},children:l?`✅ All requirements met — ready to activate`:`${c} of ${e.length} requirements met`}),!l&&(0,o.jsx)(`div`,{style:{fontSize:`11px`,color:`var(--color-text-muted)`,marginTop:`3px`},children:`Click a failed item above to jump to the relevant section and fix it.`})]}),!i&&n&&(0,o.jsxs)(`button`,{type:`button`,onClick:a,disabled:!l,style:{display:`inline-flex`,alignItems:`center`,gap:`6px`,padding:`8px 16px`,borderRadius:`8px`,border:`none`,background:l?`var(--color-primary)`:`var(--color-border)`,color:l?`var(--color-primary-contrast)`:`var(--color-text-muted)`,fontSize:`13px`,fontWeight:600,cursor:l?`pointer`:`not-allowed`,opacity:l?1:.4},children:[(0,o.jsx)(r,{size:13}),`Activate`]})]})]})}c.__docgenInfo={description:`ValidationChecklist — displays activation requirements as a list of\r
checkable items with ok/error/warn status indicators. Clicking an item\r
navigates the user to the relevant config section.`,methods:[],displayName:`ValidationChecklist`,props:{items:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{\r
  key: string;\r
  label: string;\r
  detail: string;\r
  status: ValidationChecklistItemStatus;\r
  /** Navigates to this section key when the item is clicked */\r
  sectionKey?: string;\r
  errors?: string[];\r
}`,signature:{properties:[{key:`key`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`detail`,value:{name:`string`,required:!0}},{key:`status`,value:{name:`union`,raw:`'ok' | 'error' | 'warn'`,elements:[{name:`literal`,value:`'ok'`},{name:`literal`,value:`'error'`},{name:`literal`,value:`'warn'`}],required:!0}},{key:`sectionKey`,value:{name:`string`,required:!1},description:`Navigates to this section key when the item is clicked`},{key:`errors`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!1}}]}}],raw:`ValidationChecklistItem[]`},description:``},onNavigateToSection:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(sectionKey: string) => void`,signature:{arguments:[{type:{name:`string`},name:`sectionKey`}],return:{name:`void`}}},description:`Called when the user clicks a checklist item to navigate to its section`},canActivate:{required:!1,tsType:{name:`boolean`},description:`Show the activation summary bar + activate button`,defaultValue:{value:`false`,computed:!1}},isReadOnly:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},onActivate:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}};var l=[{key:`overview`,label:`Overview complete`,detail:`Entity type, name, and configuration basis are filled.`,status:`ok`,sectionKey:`overview`},{key:`proof-rules`,label:`At least one active proof rule`,detail:`Add at least one proof document rule before activating.`,status:`error`,sectionKey:`proof-rules`,errors:[`No proof rules defined for Customer / India`,`No proof rules defined for Supplier / India`]},{key:`no-conflicts`,label:`No conflicting proof rules`,detail:`Country-specific rules must not overlap with global fallback rules.`,status:`warn`,sectionKey:`proof-rules`},{key:`verification`,label:`Verification mode set`,detail:`Select a verification mode (strict or lenient) before activating.`,status:`error`,sectionKey:`verification`,errors:[`Verification mode is required`]}],u=[{key:`identity`,label:`Legal name and registration`,detail:`Company name and registration number are filled.`,status:`ok`,sectionKey:`identity`},{key:`contact`,label:`Contact details`,detail:`Primary address, phone, and email are provided.`,status:`ok`,sectionKey:`contact`},{key:`tax`,label:`Tax identifiers`,detail:`At least one tax registration number is required.`,status:`warn`,sectionKey:`tax`},{key:`branches`,label:`Branch configuration`,detail:`At least one branch location is required.`,status:`ok`,sectionKey:`branches`}],d={title:`Experience/ValidationChecklist`,component:c,parameters:{layout:`padded`}},f={name:`KYC Setup — errors and warnings`,args:{items:l,onNavigateToSection:e=>console.log(`Navigate to section:`,e)}},p={name:`All checks passing`,args:{items:u.map(e=>({...e,status:`ok`})),onNavigateToSection:e=>console.log(`Navigate to section:`,e)}},m={name:`All passing — can activate`,args:{items:u.map(e=>({...e,status:`ok`})),canActivate:!0,onNavigateToSection:e=>console.log(`Navigate to section:`,e),onActivate:()=>console.log(`Activate clicked`)}},h={name:`Organisation Master — with warnings`,args:{items:u,onNavigateToSection:e=>console.log(`Navigate to section:`,e)}},g={name:`Read-only view (activated record)`,args:{items:u.map(e=>({...e,status:`ok`})),isReadOnly:!0}},_={name:`Critical errors — cannot activate`,args:{items:l,canActivate:!1,onNavigateToSection:e=>console.log(`Navigate to section:`,e),onActivate:()=>console.log(`Activate clicked`)}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: 'KYC Setup — errors and warnings',
  args: {
    items: KYC_ITEMS,
    onNavigateToSection: key => console.log('Navigate to section:', key)
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: 'All checks passing',
  args: {
    items: ORG_ITEMS.map(item => ({
      ...item,
      status: 'ok' as const
    })),
    onNavigateToSection: key => console.log('Navigate to section:', key)
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: 'All passing — can activate',
  args: {
    items: ORG_ITEMS.map(item => ({
      ...item,
      status: 'ok' as const
    })),
    canActivate: true,
    onNavigateToSection: key => console.log('Navigate to section:', key),
    onActivate: () => console.log('Activate clicked')
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: 'Organisation Master — with warnings',
  args: {
    items: ORG_ITEMS,
    onNavigateToSection: key => console.log('Navigate to section:', key)
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: 'Read-only view (activated record)',
  args: {
    items: ORG_ITEMS.map(item => ({
      ...item,
      status: 'ok' as const
    })),
    isReadOnly: true
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: 'Critical errors — cannot activate',
  args: {
    items: KYC_ITEMS,
    canActivate: false,
    onNavigateToSection: key => console.log('Navigate to section:', key),
    onActivate: () => console.log('Activate clicked')
  }
}`,..._.parameters?.docs?.source}}};var v=[`MixedStatuses`,`AllPassing`,`CanActivate`,`WithErrors`,`ReadOnly`,`CriticalErrors`];export{p as AllPassing,m as CanActivate,_ as CriticalErrors,f as MixedStatuses,g as ReadOnly,h as WithErrors,v as __namedExportsOrder,d as default};