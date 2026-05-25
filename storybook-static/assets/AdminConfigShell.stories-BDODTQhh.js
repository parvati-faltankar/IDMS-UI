import{r as e}from"./chunk-DHx0Hwia.js";import{t}from"./react-Czb5wP2z.js";import{t as n}from"./jsx-runtime-CGsOPcPf.js";import{n as r,t as i}from"./circle-check-CJipdeaI.js";var a=e(t(),1),o=n();function s({section:e,isActive:t,onClick:n}){let a=e.icon,s=e.completionStatus===`complete`||e.showCheckmark,c=!s&&(e.badgeCount??0)>0;return(0,o.jsxs)(`button`,{type:`button`,onClick:n,style:{width:`100%`,display:`flex`,alignItems:`center`,gap:`10px`,padding:`10px 14px`,border:`none`,background:t?`var(--color-surface-hover)`:`transparent`,cursor:`pointer`,borderInlineStart:`3px solid ${t?`var(--color-primary)`:`transparent`}`,textAlign:`left`,transition:`background 0.15s, border-color 0.15s`},children:[a&&(0,o.jsx)(a,{size:15,style:{flexShrink:0,color:t?`var(--color-primary)`:`var(--color-text-muted)`}}),(0,o.jsxs)(`div`,{style:{flex:1,minWidth:0},children:[(0,o.jsx)(`div`,{style:{fontSize:`13px`,fontWeight:t?600:500,color:t?`var(--color-primary)`:`var(--color-text)`,lineHeight:1.3},children:e.label}),e.description&&(0,o.jsx)(`div`,{style:{fontSize:`11px`,color:`var(--color-text-muted)`,marginTop:`2px`,lineHeight:1.35,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},children:e.description})]}),s?(0,o.jsx)(i,{size:16,style:{flexShrink:0,color:`color-mix(in srgb, #10b981 90%, var(--color-text))`}}):c?(0,o.jsx)(`span`,{style:{fontSize:`10px`,fontWeight:700,padding:`2px 6px`,borderRadius:`9999px`,background:`color-mix(in srgb, var(--color-danger) 12%, var(--color-surface))`,color:`var(--color-danger)`,flexShrink:0},children:e.badgeCount}):(0,o.jsx)(r,{size:16,style:{flexShrink:0,color:t?`var(--color-primary)`:`var(--color-border)`,strokeWidth:t?2.5:1.5}})]})}function c({sections:e,activeSection:t,onSectionChange:n,progress:r,children:i}){let a=r&&r.total>0?Math.round(r.completed/r.total*100):0;return(0,o.jsxs)(`div`,{style:{display:`flex`,flex:1,overflow:`hidden`,minHeight:0},children:[(0,o.jsxs)(`aside`,{style:{width:`240px`,flexShrink:0,display:`flex`,flexDirection:`column`,background:`var(--color-surface)`,borderInlineEnd:`1px solid var(--color-border)`,overflowY:`auto`},children:[(0,o.jsx)(`div`,{style:{flex:1,paddingTop:`8px`},children:e.map(e=>(0,o.jsx)(s,{section:e,isActive:t===e.key,onClick:()=>n(e.key)},e.key))}),r&&(0,o.jsxs)(`div`,{style:{padding:`14px 16px`,borderTop:`1px solid var(--color-border)`},children:[(0,o.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`7px`},children:[(0,o.jsx)(`span`,{style:{fontSize:`11px`,color:`var(--color-text-muted)`},children:`Progress`}),(0,o.jsxs)(`span`,{style:{fontSize:`11px`,fontWeight:600,color:`var(--color-primary)`},children:[r.completed,`/`,r.total]})]}),(0,o.jsx)(`div`,{style:{height:`3px`,background:`var(--color-border)`,borderRadius:`9999px`,overflow:`hidden`},children:(0,o.jsx)(`div`,{style:{height:`100%`,background:`var(--color-primary)`,borderRadius:`9999px`,width:`${a}%`,transition:`width 0.3s ease`}})})]})]}),(0,o.jsx)(`main`,{style:{flex:1,minHeight:0,overflowY:`auto`,padding:`clamp(16px, 3vw, 28px) clamp(16px, 4vw, 36px)`},children:i})]})}c.__docgenInfo={description:`AdminConfigShell — standard two-pane layout for admin configuration pages.\r
Provides a section navigation sidebar on the left and a scrollable content\r
area on the right. Designed to be composed inside a flex-column container.`,methods:[],displayName:`AdminConfigShell`,props:{sections:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{\r
  key: string;\r
  label: string;\r
  description?: string;\r
  icon?: React.ElementType;\r
  completionStatus?: AdminConfigSectionCompletion;\r
  /** Red badge count — shown when > 0 and no green checkmark */\r
  badgeCount?: number;\r
  /** Override to show green checkmark regardless of completionStatus */\r
  showCheckmark?: boolean;\r
}`,signature:{properties:[{key:`key`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`description`,value:{name:`string`,required:!1}},{key:`icon`,value:{name:`ReactElementType`,raw:`React.ElementType`,required:!1}},{key:`completionStatus`,value:{name:`union`,raw:`'complete' | 'partial' | 'empty'`,elements:[{name:`literal`,value:`'complete'`},{name:`literal`,value:`'partial'`},{name:`literal`,value:`'empty'`}],required:!1}},{key:`badgeCount`,value:{name:`number`,required:!1},description:`Red badge count — shown when > 0 and no green checkmark`},{key:`showCheckmark`,value:{name:`boolean`,required:!1},description:`Override to show green checkmark regardless of completionStatus`}]}}],raw:`AdminConfigSectionItem[]`},description:`Section navigation items`},activeSection:{required:!0,tsType:{name:`string`},description:`Currently active section key`},onSectionChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(key: string) => void`,signature:{arguments:[{type:{name:`string`},name:`key`}],return:{name:`void`}}},description:`Called when user clicks a section in the nav`},progress:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{\r
  completed: number;\r
  total: number;\r
}`,signature:{properties:[{key:`completed`,value:{name:`number`,required:!0}},{key:`total`,value:{name:`number`,required:!0}}]}},description:`Optional progress bar at the bottom of the section nav`},children:{required:!0,tsType:{name:`ReactReactNode`,raw:`React.ReactNode`},description:`Main content area`}}};var l=[{key:`overview`,label:`Overview`,description:`Entity type, name, and configuration basis`,completionStatus:`complete`},{key:`proof-rules`,label:`Proof Rules`,description:`Country-wise required proof documents`,completionStatus:`partial`},{key:`verification`,label:`Verification`,description:`Verification mode and expiry handling`,completionStatus:`empty`},{key:`history`,label:`History`,description:`Configuration change log`,completionStatus:`empty`}],u=[{key:`identity`,label:`Identity`,description:`Legal name, registration, and entity type`,completionStatus:`complete`},{key:`contact`,label:`Contact & Address`,description:`Primary address, phone, and email`,completionStatus:`complete`},{key:`tax`,label:`Tax Identifiers`,description:`GST, VAT, and other tax registrations`,completionStatus:`partial`},{key:`branches`,label:`Branches`,description:`Physical locations and virtual sites`,completionStatus:`empty`},{key:`branding`,label:`Branding`,description:`Company logo and document header assets`,completionStatus:`empty`}];function d({sections:e,initialSection:t,progress:n}){let[r,i]=(0,a.useState)(t),s=e.find(e=>e.key===r);return(0,o.jsx)(`div`,{style:{height:`480px`,display:`flex`,flexDirection:`column`,border:`1px solid var(--color-border)`,borderRadius:`12px`,overflow:`hidden`},children:(0,o.jsx)(c,{sections:e,activeSection:r,onSectionChange:i,progress:n,children:(0,o.jsxs)(`div`,{style:{padding:`24px`,background:`var(--color-surface-subtle)`,borderRadius:`8px`,border:`1px solid var(--color-border)`,minHeight:`200px`},children:[(0,o.jsx)(`p`,{style:{fontSize:`14px`,fontWeight:600,color:`var(--color-text)`,marginBottom:`6px`},children:s?.label??r}),s?.description&&(0,o.jsx)(`p`,{style:{fontSize:`13px`,color:`var(--color-text-muted)`},children:s.description}),(0,o.jsx)(`p`,{style:{fontSize:`12px`,color:`var(--color-text-muted)`,marginTop:`12px`,fontStyle:`italic`},children:`Section form content renders here. Click the nav to switch sections.`})]})})})}var f={title:`Experience/AdminConfigShell`,parameters:{layout:`padded`}},p={name:`KYC Setup — mixed completion`,render:()=>(0,o.jsx)(d,{sections:l,initialSection:`overview`,progress:{completed:1,total:4}})},m={name:`Organisation Master — in progress`,render:()=>(0,o.jsx)(d,{sections:u,initialSection:`tax`,progress:{completed:2,total:5}})},h={name:`All sections complete`,render:()=>(0,o.jsx)(d,{sections:l.map(e=>({...e,completionStatus:`complete`})),initialSection:`overview`,progress:{completed:4,total:4}})},g={name:`Fresh configuration — nothing started`,render:()=>(0,o.jsx)(d,{sections:u.map(e=>({...e,completionStatus:`empty`})),initialSection:`identity`,progress:{completed:0,total:5}})},_={name:`Two sections — no progress bar`,render:()=>(0,o.jsx)(d,{sections:[{key:`prefixes`,label:`Code Prefixes`,description:`Numbering prefix configuration`,completionStatus:`complete`},{key:`policy`,label:`Code Policy`,description:`Auto-generation and sequence rules`,completionStatus:`partial`}],initialSection:`prefixes`})},v={name:`Section with attention badge`,render:()=>(0,o.jsx)(d,{sections:[{key:`overview`,label:`Overview`,description:`Entity details`,completionStatus:`complete`},{key:`proof-rules`,label:`Proof Rules`,description:`Document requirements`,completionStatus:`partial`,badgeCount:3},{key:`verification`,label:`Verification`,description:`Expiry and mode rules`,completionStatus:`empty`}],initialSection:`proof-rules`,progress:{completed:1,total:3}})};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: 'KYC Setup — mixed completion',
  render: () => <ShellDemo sections={KYC_SECTIONS} initialSection="overview" progress={{
    completed: 1,
    total: 4
  }} />
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: 'Organisation Master — in progress',
  render: () => <ShellDemo sections={ORG_SECTIONS} initialSection="tax" progress={{
    completed: 2,
    total: 5
  }} />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: 'All sections complete',
  render: () => <ShellDemo sections={KYC_SECTIONS.map(s => ({
    ...s,
    completionStatus: 'complete' as const
  }))} initialSection="overview" progress={{
    completed: 4,
    total: 4
  }} />
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: 'Fresh configuration — nothing started',
  render: () => <ShellDemo sections={ORG_SECTIONS.map(s => ({
    ...s,
    completionStatus: 'empty' as const
  }))} initialSection="identity" progress={{
    completed: 0,
    total: 5
  }} />
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: 'Two sections — no progress bar',
  render: () => <ShellDemo sections={[{
    key: 'prefixes',
    label: 'Code Prefixes',
    description: 'Numbering prefix configuration',
    completionStatus: 'complete'
  }, {
    key: 'policy',
    label: 'Code Policy',
    description: 'Auto-generation and sequence rules',
    completionStatus: 'partial'
  }]} initialSection="prefixes" />
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: 'Section with attention badge',
  render: () => <ShellDemo sections={[{
    key: 'overview',
    label: 'Overview',
    description: 'Entity details',
    completionStatus: 'complete'
  }, {
    key: 'proof-rules',
    label: 'Proof Rules',
    description: 'Document requirements',
    completionStatus: 'partial',
    badgeCount: 3
  }, {
    key: 'verification',
    label: 'Verification',
    description: 'Expiry and mode rules',
    completionStatus: 'empty'
  }]} initialSection="proof-rules" progress={{
    completed: 1,
    total: 3
  }} />
}`,...v.parameters?.docs?.source}}};var y=[`KycSetupMixed`,`OrgMasterInProgress`,`AllSectionsComplete`,`FreshConfiguration`,`TwoSectionsNoProgress`,`WithAttentionBadge`];export{h as AllSectionsComplete,g as FreshConfiguration,p as KycSetupMixed,m as OrgMasterInProgress,_ as TwoSectionsNoProgress,v as WithAttentionBadge,y as __namedExportsOrder,f as default};