const qt=globalThis,Zt=globalThis.process||{},Ni=globalThis.navigator||{};function dn(e){if(typeof window<"u"&&window.process?.type==="renderer"||typeof process<"u"&&process.versions?.electron)return!0;const n=typeof navigator<"u"&&navigator.userAgent;return!!(n&&n.indexOf("Electron")>=0)}function Wt(){return!(typeof process=="object"&&String(process)==="[object process]"&&!process?.browser)||dn()}const be="4.1.0";function pn(e){try{const t=window[e],n="__storage_test__";return t.setItem(n,n),t.removeItem(n),t}catch{return null}}class mn{constructor(t,n,s="sessionStorage"){this.storage=pn(s),this.id=t,this.config=n,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(t){if(Object.assign(this.config,t),this.storage){const n=JSON.stringify(this.config);this.storage.setItem(this.id,n)}}_loadConfiguration(){let t={};if(this.storage){const n=this.storage.getItem(this.id);t=n?JSON.parse(n):{}}return Object.assign(this.config,t),this}}function gn(e){let t;return e<10?t=`${e.toFixed(2)}ms`:e<100?t=`${e.toFixed(1)}ms`:e<1e3?t=`${e.toFixed(0)}ms`:t=`${(e/1e3).toFixed(2)}s`,t}function _n(e,t=8){const n=Math.max(t-e.length,0);return`${" ".repeat(n)}${e}`}var ut;(function(e){e[e.BLACK=30]="BLACK",e[e.RED=31]="RED",e[e.GREEN=32]="GREEN",e[e.YELLOW=33]="YELLOW",e[e.BLUE=34]="BLUE",e[e.MAGENTA=35]="MAGENTA",e[e.CYAN=36]="CYAN",e[e.WHITE=37]="WHITE",e[e.BRIGHT_BLACK=90]="BRIGHT_BLACK",e[e.BRIGHT_RED=91]="BRIGHT_RED",e[e.BRIGHT_GREEN=92]="BRIGHT_GREEN",e[e.BRIGHT_YELLOW=93]="BRIGHT_YELLOW",e[e.BRIGHT_BLUE=94]="BRIGHT_BLUE",e[e.BRIGHT_MAGENTA=95]="BRIGHT_MAGENTA",e[e.BRIGHT_CYAN=96]="BRIGHT_CYAN",e[e.BRIGHT_WHITE=97]="BRIGHT_WHITE"})(ut||(ut={}));const En=10;function Kt(e){return typeof e!="string"?e:(e=e.toUpperCase(),ut[e]||ut.WHITE)}function yn(e,t,n){return!Wt&&typeof e=="string"&&(t&&(e=`\x1B[${Kt(t)}m${e}\x1B[39m`),n&&(e=`\x1B[${Kt(n)+En}m${e}\x1B[49m`)),e}function Tn(e,t=["constructor"]){const n=Object.getPrototypeOf(e),s=Object.getOwnPropertyNames(n),r=e;for(const i of s){const o=r[i];typeof o=="function"&&(t.find(c=>i===c)||(r[i]=o.bind(e)))}}function Bt(e,t){if(!e)throw new Error("Assertion failed")}function V(){let e;if(Wt()&&qt.performance)e=qt?.performance?.now?.();else if("hrtime"in Zt){const t=Zt?.hrtime?.();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}const Y={debug:Wt()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},Mn={enabled:!0,level:0};function H(){}const Jt={},Qt={once:!0};class Vt{constructor({id:t}={id:""}){this.VERSION=be,this._startTs=V(),this._deltaTs=V(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=t,this.userData={},this._storage=new mn(`__probe-${this.id}__`,Mn),this.timeStamp(`${this.id} started`),Tn(this),Object.seal(this)}set level(t){this.setLevel(t)}get level(){return this.getLevel()}isEnabled(){return this._storage.config.enabled}getLevel(){return this._storage.config.level}getTotal(){return Number((V()-this._startTs).toPrecision(10))}getDelta(){return Number((V()-this._deltaTs).toPrecision(10))}set priority(t){this.level=t}get priority(){return this.level}getPriority(){return this.level}enable(t=!0){return this._storage.setConfiguration({enabled:t}),this}setLevel(t){return this._storage.setConfiguration({level:t}),this}get(t){return this._storage.config[t]}set(t,n){this._storage.setConfiguration({[t]:n})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(t,n){if(!t)throw new Error(n||"Assertion failed")}warn(t){return this._getLogFunction(0,t,Y.warn,arguments,Qt)}error(t){return this._getLogFunction(0,t,Y.error,arguments)}deprecated(t,n){return this.warn(`\`${t}\` is deprecated and will be removed in a later version. Use \`${n}\` instead`)}removed(t,n){return this.error(`\`${t}\` has been removed. Use \`${n}\` instead`)}probe(t,n){return this._getLogFunction(t,n,Y.log,arguments,{time:!0,once:!0})}log(t,n){return this._getLogFunction(t,n,Y.debug,arguments)}info(t,n){return this._getLogFunction(t,n,console.info,arguments)}once(t,n){return this._getLogFunction(t,n,Y.debug||Y.info,arguments,Qt)}table(t,n,s){return n?this._getLogFunction(t,n,console.table||H,s&&[s],{tag:Sn(n)}):H}time(t,n){return this._getLogFunction(t,n,console.time?console.time:console.info)}timeEnd(t,n){return this._getLogFunction(t,n,console.timeEnd?console.timeEnd:console.info)}timeStamp(t,n){return this._getLogFunction(t,n,console.timeStamp||H)}group(t,n,s={collapsed:!1}){const r=te({logLevel:t,message:n,opts:s}),{collapsed:i}=s;return r.method=(i?console.groupCollapsed:console.group)||console.info,this._getLogFunction(r)}groupCollapsed(t,n,s={}){return this.group(t,n,Object.assign({},s,{collapsed:!0}))}groupEnd(t){return this._getLogFunction(t,"",console.groupEnd||H)}withGroup(t,n,s){this.group(t,n)();try{s()}finally{this.groupEnd(t)()}}trace(){console.trace&&console.trace()}_shouldLog(t){return this.isEnabled()&&this.getLevel()>=Oe(t)}_getLogFunction(t,n,s,r,i){if(this._shouldLog(t)){i=te({logLevel:t,message:n,args:r,opts:i}),s=s||i.method,Bt(s),i.total=this.getTotal(),i.delta=this.getDelta(),this._deltaTs=V();const o=i.tag||i.message;if(i.once&&o)if(!Jt[o])Jt[o]=V();else return H;return n=vn(this.id,i.message,i),s.bind(console,n,...i.args)}return H}}Vt.VERSION=be;function Oe(e){if(!e)return 0;let t;switch(typeof e){case"number":t=e;break;case"object":t=e.logLevel||e.priority||0;break;default:return 0}return Bt(Number.isFinite(t)&&t>=0),t}function te(e){const{logLevel:t,message:n}=e;e.logLevel=Oe(t);const s=e.args?Array.from(e.args):[];for(;s.length&&s.shift()!==n;);switch(typeof t){case"string":case"function":n!==void 0&&s.unshift(n),e.message=t;break;case"object":Object.assign(e,t);break}typeof e.message=="function"&&(e.message=e.message());const r=typeof e.message;return Bt(r==="string"||r==="object"),Object.assign(e,{args:s},e.opts)}function vn(e,t,n){if(typeof t=="string"){const s=n.time?_n(gn(n.total)):"";t=n.time?`${e}: ${s}  ${t}`:`${e}: ${t}`,t=yn(t,n.color,n.background)}return t}function Sn(e){for(const t in e)for(const n in e[t])return n||"untitled";return"empty"}const Re=new Vt({id:"deck"});function Yt(e,t){if(!e)throw new Error(t||"shadertools: assertion failed.")}const bt={number:{type:"number",validate(e,t){return Number.isFinite(e)&&typeof t=="object"&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:"array",validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function An(e){const t={};for(const[n,s]of Object.entries(e))t[n]=Ln(s);return t}function Ln(e){let t=ee(e);if(t!=="object")return{value:e,...bt[t],type:t};if(typeof e=="object")return e?e.type!==void 0?{...e,...bt[e.type],type:e.type}:e.value===void 0?{type:"object",value:e}:(t=ee(e.value),{...e,...bt[t],type:t}):{type:"object",value:null};throw new Error("props")}function ee(e){return Array.isArray(e)||ArrayBuffer.isView(e)?"array":typeof e}const bn=`#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,On=`#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`,Rn={vertex:bn,fragment:On},ne=/void\s+main\s*\([^)]*\)\s*\{\n?/,se=/}\n?[^{}]*$/,Ot=[],lt="__LUMA_INJECT_DECLARATIONS__";function xn(e){const t={vertex:{},fragment:{}};for(const n in e){let s=e[n];const r=Pn(n);typeof s=="string"&&(s={order:0,injection:s}),t[r][n]=s}return t}function Pn(e){const t=e.slice(0,2);switch(t){case"vs":return"vertex";case"fs":return"fragment";default:throw new Error(t)}}function dt(e,t,n,s=!1){const r=t==="vertex";for(const i in n){const o=n[i];o.sort((a,l)=>a.order-l.order),Ot.length=o.length;for(let a=0,l=o.length;a<l;++a)Ot[a]=o[a].injection;const c=`${Ot.join(`
`)}
`;switch(i){case"vs:#decl":r&&(e=e.replace(lt,c));break;case"vs:#main-start":r&&(e=e.replace(ne,a=>a+c));break;case"vs:#main-end":r&&(e=e.replace(se,a=>c+a));break;case"fs:#decl":r||(e=e.replace(lt,c));break;case"fs:#main-start":r||(e=e.replace(ne,a=>a+c));break;case"fs:#main-end":r||(e=e.replace(se,a=>c+a));break;default:e=e.replace(i,a=>a+c)}}return e=e.replace(lt,""),s&&(e=e.replace(/\}\s*$/,i=>i+Rn[t])),e}function pt(e){e.map(t=>wn(t))}function wn(e){if(e.instance)return;pt(e.dependencies||[]);const{propTypes:t={},deprecations:n=[],inject:s={}}=e,r={normalizedInjections:xn(s),parsedDeprecations:In(n)};t&&(r.propValidators=An(t)),e.instance=r;let i={};t&&(i=Object.entries(t).reduce((o,[c,a])=>{const l=a?.value;return l&&(o[c]=l),o},{})),e.defaultUniforms={...e.defaultUniforms,...i}}function xe(e,t,n){e.deprecations?.forEach(s=>{s.regex?.test(t)&&(s.deprecated?n.deprecated(s.old,s.new)():n.removed(s.old,s.new)())})}function In(e){return e.forEach(t=>{switch(t.type){case"function":t.regex=new RegExp(`\\b${t.old}\\(`);break;default:t.regex=new RegExp(`${t.type} ${t.old};`)}}),e}function Pe(e){pt(e);const t={},n={};we({modules:e,level:0,moduleMap:t,moduleDepth:n});const s=Object.keys(n).sort((r,i)=>n[i]-n[r]).map(r=>t[r]);return pt(s),s}function we(e){const{modules:t,level:n,moduleMap:s,moduleDepth:r}=e;if(n>=5)throw new Error("Possible loop in shader dependency graph");for(const i of t)s[i.name]=i,(r[i.name]===void 0||r[i.name]<n)&&(r[i.name]=n);for(const i of t)i.dependencies&&we({modules:i.dependencies,level:n+1,moduleMap:s,moduleDepth:r})}function jn(e){switch(e?.gpu.toLowerCase()){case"apple":return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"nvidia":return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case"intel":return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"amd":return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}function Nn(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw new Error("luma.gl v9 only supports GLSL 3.00 shader sources");switch(t){case"vertex":return e=re(e,Cn),e;case"fragment":return e=re(e,Dn),e;default:throw new Error(t)}}const Ie=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,"textureLod("],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,"texture("]],Cn=[...Ie,[Dt("attribute"),"in $1"],[Dt("varying"),"out $1"]],Dn=[...Ie,[Dt("varying"),"in $1"]];function re(e,t){for(const[n,s]of t)e=e.replace(n,s);return e}function Dt(e){return new RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,"g")}function je(e,t){let n="";for(const s in e){const r=e[s];if(n+=`void ${r.signature} {
`,r.header&&(n+=`  ${r.header}`),t[s]){const i=t[s];i.sort((o,c)=>o.order-c.order);for(const o of i)n+=`  ${o.injection}
`}r.footer&&(n+=`  ${r.footer}`),n+=`}
`}return n}function Ne(e){const t={vertex:{},fragment:{}};for(const n of e){let s,r;typeof n!="string"?(s=n,r=s.hook):(s={},r=n),r=r.trim();const[i,o]=r.split(":"),c=r.replace(/\(.+/,""),a=Object.assign(s,{signature:o});switch(i){case"vs":t.vertex[c]=a;break;case"fs":t.fragment[c]=a;break;default:throw new Error(i)}}return t}function Un(e,t){return{name:Fn(e,t),language:"glsl",version:zn(e)}}function Fn(e,t="unnamed"){const s=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return s?s[1]:t}function zn(e){let t=100;const n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]==="#version"){const s=parseInt(n[1],10);Number.isFinite(s)&&(t=s)}if(t!==100&&t!==300)throw new Error(`Invalid GLSL version ${t}`);return t}const Ce=`

${lt}
`,kn=`precision highp float;
`;function Gn(e){const t=Pe(e.modules||[]);return{source:Wn(e.platformInfo,{...e,source:e.source,stage:"vertex",modules:t}),getUniforms:De(t)}}function $n(e){const{vs:t,fs:n}=e,s=Pe(e.modules||[]);return{vs:ie(e.platformInfo,{...e,source:t,stage:"vertex",modules:s}),fs:ie(e.platformInfo,{...e,source:n,stage:"fragment",modules:s}),getUniforms:De(s)}}function Wn(e,t){const{source:n,stage:s,modules:r,hookFunctions:i=[],inject:o={},log:c}=t;Yt(typeof n=="string","shader source must be a string");const a=n;let l="";const f=Ne(i),h={},u={},d={};for(const p in o){const g=typeof o[p]=="string"?{injection:o[p],order:0}:o[p],E=/^(v|f)s:(#)?([\w-]+)$/.exec(p);if(E){const _=E[2],y=E[3];_?y==="decl"?u[p]=[g]:d[p]=[g]:h[p]=[g]}else d[p]=[g]}const m=r;for(const p of m){c&&xe(p,a,c);const g=Ue(p,"wgsl");l+=g;const E=p.injections?.[s]||{};for(const _ in E){const y=/^(v|f)s:#([\w-]+)$/.exec(_);if(y){const v=y[2]==="decl"?u:d;v[_]=v[_]||[],v[_].push(E[_])}else h[_]=h[_]||[],h[_].push(E[_])}}return l+=Ce,l=dt(l,s,u),l+=je(f[s],h),l+=a,l=dt(l,s,d),l}function ie(e,t){const{id:n,source:s,stage:r,language:i="glsl",modules:o,defines:c={},hookFunctions:a=[],inject:l={},prologue:f=!0,log:h}=t;Yt(typeof s=="string","shader source must be a string");const u=i==="glsl"?Un(s).version:-1,d=e.shaderLanguageVersion,m=u===100?"#version 100":"#version 300 es",g=s.split(`
`).slice(1).join(`
`),E={};o.forEach(A=>{Object.assign(E,A.defines)}),Object.assign(E,c);let _="";switch(i){case"wgsl":break;case"glsl":_=f?`${m}

// ----- PROLOGUE -------------------------
${Bn({id:n,source:s,stage:r})}
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${jn(e)}
${r==="fragment"?kn:""}

// ----- APPLICATION DEFINES -------------------------

${Vn(E)}

`:`${m}
`;break}const y=Ne(a),T={},v={},M={};for(const A in l){const R=typeof l[A]=="string"?{injection:l[A],order:0}:l[A],b=/^(v|f)s:(#)?([\w-]+)$/.exec(A);if(b){const L=b[2],I=b[3];L?I==="decl"?v[A]=[R]:M[A]=[R]:T[A]=[R]}else M[A]=[R]}for(const A of o){h&&xe(A,g,h);const R=Ue(A,r);_+=R;const b=A.instance?.normalizedInjections[r]||{};for(const L in b){const I=/^(v|f)s:#([\w-]+)$/.exec(L);if(I){const j=I[2]==="decl"?v:M;j[L]=j[L]||[],j[L].push(b[L])}else T[L]=T[L]||[],T[L].push(b[L])}}return _+="// ----- MAIN SHADER SOURCE -------------------------",_+=Ce,_=dt(_,r,v),_+=je(y[r],T),_+=g,_=dt(_,r,M),i==="glsl"&&u!==d&&(_=Nn(_,r)),_.trim()}function De(e){return function(n){const s={};for(const r of e){const i=r.getUniforms?.(n,s);Object.assign(s,i)}return s}}function Bn(e){const{id:t,source:n,stage:s}=e;return t&&n.indexOf("SHADER_NAME")===-1?`
#define SHADER_NAME ${t}_${s}`:""}function Vn(e={}){let t="";for(const n in e){const s=e[n];(s||Number.isFinite(s))&&(t+=`#define ${n.toUpperCase()} ${e[n]}
`)}return t}function Ue(e,t){let n;switch(t){case"vertex":n=e.vs||"";break;case"fragment":n=e.fs||"";break;case"wgsl":n=e.source||"";break;default:Yt(!1)}if(!e.name)throw new Error("Shader module must have a name");const s=e.name.toUpperCase().replace(/[^0-9a-z]/gi,"_");let r=`// ----- MODULE ${e.name} ---------------

`;return t!=="wgsl"&&(r+=`#define MODULE_${s}
`),r+=`${n}
`,r}const Yn=/^\s*\#\s*ifdef\s*([a-zA-Z_]+)\s*$/,Hn=/^\s*\#\s*endif\s*$/;function Xn(e,t){const n=e.split(`
`),s=[];let r=!0,i=null;for(const o of n){const c=o.match(Yn),a=o.match(Hn);c?(i=c[1],r=!!t?.defines?.[i]):a?r=!0:r&&s.push(o)}return s.join(`
`)}class nt{static defaultShaderAssembler;_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(){return nt.defaultShaderAssembler=nt.defaultShaderAssembler||new nt,nt.defaultShaderAssembler}addDefaultModule(t){this._defaultModules.find(n=>n.name===(typeof t=="string"?t:t.name))||this._defaultModules.push(t)}removeDefaultModule(t){const n=typeof t=="string"?t:t.name;this._defaultModules=this._defaultModules.filter(s=>s.name!==n)}addShaderHook(t,n){n&&(t=Object.assign(n,{hook:t})),this._hookFunctions.push(t)}assembleWGSLShader(t){const n=this._getModuleList(t.modules),s=this._hookFunctions,{source:r,getUniforms:i}=Gn({...t,source:t.source,modules:n,hookFunctions:s});return{source:t.platformInfo.shaderLanguage==="wgsl"?Xn(r):r,getUniforms:i,modules:n}}assembleGLSLShaderPair(t){const n=this._getModuleList(t.modules),s=this._hookFunctions;return{...$n({...t,vs:t.vs,fs:t.fs,modules:n,hookFunctions:s}),modules:n}}_getModuleList(t=[]){const n=new Array(this._defaultModules.length+t.length),s={};let r=0;for(let i=0,o=this._defaultModules.length;i<o;++i){const c=this._defaultModules[i],a=c.name;n[r++]=c,s[a]=!0}for(let i=0,o=t.length;i<o;++i){const c=t[i],a=c.name;s[a]||(n[r++]=c,s[a]=!0)}return n.length=r,pt(n),n}}const Ht=new Vt({id:"luma.gl"}),Rt={};function Fe(e="id"){Rt[e]=Rt[e]||1;const t=Rt[e]++;return`${e}-${t}`}class F{static defaultProps={id:"undefined",handle:void 0,userData:void 0};toString(){return`${this[Symbol.toStringTag]||this.constructor.name}:"${this.id}"`}id;props;userData={};_device;destroyed=!1;allocatedBytes=0;_attachedResources=new Set;constructor(t,n,s){if(!t)throw new Error("no device");this._device=t,this.props=qn(n,s);const r=this.props.id!=="undefined"?this.props.id:Fe(this[Symbol.toStringTag]);this.props.id=r,this.id=r,this.userData=this.props.userData||{},this.addStats()}destroy(){this.destroyResource()}delete(){return this.destroy(),this}getProps(){return this.props}attachResource(t){this._attachedResources.add(t)}detachResource(t){this._attachedResources.delete(t)}destroyAttachedResource(t){this._attachedResources.delete(t)&&t.destroy()}destroyAttachedResources(){for(const t of Object.values(this._attachedResources))t.destroy();this._attachedResources=new Set}destroyResource(){this.destroyAttachedResources(),this.removeStats(),this.destroyed=!0}removeStats(){const t=this._device.statsManager.getStats("Resource Counts"),n=this[Symbol.toStringTag];t.get(`${n}s Active`).decrementCount()}trackAllocatedMemory(t,n=this[Symbol.toStringTag]){const s=this._device.statsManager.getStats("Resource Counts");s.get("GPU Memory").addCount(t),s.get(`${n} Memory`).addCount(t),this.allocatedBytes=t}trackDeallocatedMemory(t=this[Symbol.toStringTag]){const n=this._device.statsManager.getStats("Resource Counts");n.get("GPU Memory").subtractCount(this.allocatedBytes),n.get(`${t} Memory`).subtractCount(this.allocatedBytes),this.allocatedBytes=0}addStats(){const t=this._device.statsManager.getStats("Resource Counts"),n=this[Symbol.toStringTag];t.get("Resources Created").incrementCount(),t.get(`${n}s Created`).incrementCount(),t.get(`${n}s Active`).incrementCount()}}function qn(e,t){const n={...t};for(const s in e)e[s]!==void 0&&(n[s]=e[s]);return n}class ft extends F{static defaultProps={...F.defaultProps,usage:0,byteLength:0,byteOffset:0,data:null,indexType:"uint16",mappedAtCreation:!1};static MAP_READ=1;static MAP_WRITE=2;static COPY_SRC=4;static COPY_DST=8;static INDEX=16;static VERTEX=32;static UNIFORM=64;static STORAGE=128;static INDIRECT=256;static QUERY_RESOLVE=512;get[Symbol.toStringTag](){return"Buffer"}usage;indexType;updateTimestamp;constructor(t,n){const s={...n};(n.usage||0)&ft.INDEX&&!n.indexType&&(n.data instanceof Uint32Array?s.indexType="uint32":n.data instanceof Uint16Array&&(s.indexType="uint16")),delete s.data,super(t,s,ft.defaultProps),this.usage=s.usage||0,this.indexType=s.indexType,this.updateTimestamp=t.incrementTimestamp()}clone(t){return this.device.createBuffer({...this.props,...t})}readSyncWebGL(t,n){throw new Error("not implemented")}static DEBUG_DATA_MAX_LENGTH=32;debugData=new ArrayBuffer(0);_setDebugData(t,n,s){const r=ArrayBuffer.isView(t)?t.buffer:t,i=Math.min(t?t.byteLength:s,ft.DEBUG_DATA_MAX_LENGTH);r===null?this.debugData=new ArrayBuffer(i):n===0&&s===r.byteLength?this.debugData=r.slice(0,i):this.debugData=r.slice(n,n+i)}}function Zn(e){const t=oe[e],n=Kn(t),s=e.includes("norm"),r=!s&&!e.startsWith("float"),i=e.startsWith("s");return{dataType:oe[e],byteLength:n,integer:r,signed:i,normalized:s}}function Kn(e){return Jn[e]}const oe={uint8:"uint8",sint8:"sint8",unorm8:"uint8",snorm8:"sint8",uint16:"uint16",sint16:"sint16",unorm16:"uint16",snorm16:"sint16",float16:"float16",float32:"float32",uint32:"uint32",sint32:"sint32"},Jn={uint8:1,sint8:1,uint16:2,sint16:2,float16:2,float32:4,uint32:4,sint32:4};class $ extends F{static COPY_SRC=1;static COPY_DST=2;static TEXTURE=4;static STORAGE=8;static RENDER_ATTACHMENT=16;static CubeFaces=["+X","-X","+Y","-Y","+Z","-Z"];static defaultProps={...F.defaultProps,data:null,dimension:"2d",format:"rgba8unorm",width:void 0,height:void 0,depth:1,mipmaps:!1,compressed:!1,usage:0,mipLevels:void 0,samples:void 0,sampler:{},view:void 0,flipY:void 0};get[Symbol.toStringTag](){return"Texture"}toString(){return`Texture(${this.id},${this.format},${this.width}x${this.height})`}dimension;format;width;height;depth;mipLevels;updateTimestamp;constructor(t,n){if(n=$.normalizeProps(t,n),super(t,n,$.defaultProps),this.dimension=this.props.dimension,this.format=this.props.format,this.width=this.props.width,this.height=this.props.height,this.depth=this.props.depth,this.props.width===void 0||this.props.height===void 0){const s=$.getTextureDataSize(this.props.data);this.width=s?.width||1,this.height=s?.height||1}this.props.mipmaps&&this.props.mipLevels===void 0&&(this.props.mipLevels="pyramid"),this.mipLevels=this.props.mipLevels==="pyramid"?$.getMipLevelCount(this.width,this.height):this.props.mipLevels||1,this.updateTimestamp=t.incrementTimestamp()}clone(t){return this.device.createTexture({...this.props,...t})}static isExternalImage(t){return typeof ImageData<"u"&&t instanceof ImageData||typeof ImageBitmap<"u"&&t instanceof ImageBitmap||typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement||typeof VideoFrame<"u"&&t instanceof VideoFrame||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas}static getExternalImageSize(t){if(typeof ImageData<"u"&&t instanceof ImageData||typeof ImageBitmap<"u"&&t instanceof ImageBitmap||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas)return{width:t.width,height:t.height};if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return{width:t.naturalWidth,height:t.naturalHeight};if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return{width:t.videoWidth,height:t.videoHeight};if(typeof VideoFrame<"u"&&t instanceof VideoFrame)return{width:t.displayWidth,height:t.displayHeight};throw new Error("Unknown image type")}static isTextureLevelData(t){const n=t?.data;return ArrayBuffer.isView(n)}static getTextureDataSize(t){if(!t||ArrayBuffer.isView(t))return null;if(Array.isArray(t))return $.getTextureDataSize(t[0]);if($.isExternalImage(t))return $.getExternalImageSize(t);if(t&&typeof t=="object"&&t.constructor===Object){const s=Object.values(t)[0];return{width:s.width,height:s.height}}throw new Error("texture size deduction failed")}static normalizeTextureData(t,n){let s;return ArrayBuffer.isView(t)?s=[{data:t,width:n.width,height:n.height}]:Array.isArray(t)?s=t:s=[t],s}static getMipLevelCount(t,n){return Math.floor(Math.log2(Math.max(t,n)))+1}static getCubeFaceDepth(t){switch(t){case"+X":return 0;case"-X":return 1;case"+Y":return 2;case"-Y":return 3;case"+Z":return 4;case"-Z":return 5;default:throw new Error(t)}}static defaultCopyExternalImageOptions={image:void 0,sourceX:0,sourceY:0,width:void 0,height:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:"all",colorSpace:"srgb",premultipliedAlpha:!1,flipY:!1};static normalizeProps(t,n){const s={...n},r=t?.props?._resourceDefaults?.texture||{};Object.assign(s,r);const{width:i,height:o}=s;return typeof i=="number"&&(s.width=Math.max(1,Math.ceil(i))),typeof o=="number"&&(s.height=Math.max(1,Math.ceil(o))),s}}class ze extends F{static defaultProps={...F.defaultProps,format:void 0,dimension:void 0,aspect:"all",baseMipLevel:0,mipLevelCount:void 0,baseArrayLayer:0,arrayLayerCount:void 0};get[Symbol.toStringTag](){return"TextureView"}constructor(t,n){super(t,n,ze.defaultProps)}}function Qn(e,t,n){let s="";const r=t.split(/\r?\n/),i=e.slice().sort((o,c)=>o.lineNum-c.lineNum);switch(n?.showSourceCode||"no"){case"all":let o=0;for(let c=1;c<=r.length;c++)for(s+=ke(r[c-1],c,n);i.length>o&&i[o].lineNum===c;){const a=i[o++];s+=ce(a,r,a.lineNum,{...n,inlineSource:!1})}return s;case"issues":case"no":for(const c of e)s+=ce(c,r,c.lineNum,{inlineSource:n?.showSourceCode!=="no"});return s}}function ce(e,t,n,s){if(s?.inlineSource){const i=ts(t,n),o=e.linePos>0?`${" ".repeat(e.linePos+5)}^^^
`:"";return`
${i}${o}${e.type.toUpperCase()}: ${e.message}

`}const r=e.type==="error"?"red":"#8B4000";return s?.html?`<div class='luma-compiler-log-error' style="color:${r};"><b> ${e.type.toUpperCase()}: ${e.message}</b></div>`:`${e.type.toUpperCase()}: ${e.message}`}function ts(e,t,n){let s="";for(let r=t-2;r<=t;r++){const i=e[r-1];i!==void 0&&(s+=ke(i,t,n))}return s}function ke(e,t,n){const s=n?.html?ns(e):e;return`${es(String(t),4)}: ${s}${n?.html?"<br/>":`
`}`}function es(e,t){let n="";for(let s=e.length;s<t;++s)n+=" ";return n+e}function ns(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}class Ge extends F{static defaultProps={...F.defaultProps,language:"auto",stage:void 0,source:"",sourceMap:null,entryPoint:"main",debugShaders:void 0};get[Symbol.toStringTag](){return"Shader"}stage;source;compilationStatus="pending";constructor(t,n){n={...n,debugShaders:n.debugShaders||t.props.debugShaders||"errors"},super(t,{id:ss(n),...n},Ge.defaultProps),this.stage=this.props.stage,this.source=this.props.source}getCompilationInfoSync(){return null}getTranslatedSource(){return null}async debugShader(){const t=this.props.debugShaders;switch(t){case"never":return;case"errors":if(this.compilationStatus==="success")return;break}const n=await this.getCompilationInfo();t==="warnings"&&n?.length===0||this._displayShaderLog(n)}_displayShaderLog(t){if(typeof document>"u"||!document?.createElement)return;const n=$e(this.source),s=`${this.stage} ${n}`;let r=Qn(t,this.source,{showSourceCode:"all",html:!0});const i=this.getTranslatedSource();i&&(r+=`<br /><br /><h1>Translated Source</h1><br /><br /><code style="user-select:text;"><pre>${i}</pre></code>`);const o=document.createElement("Button");o.innerHTML=`
<h1>Shader Compilation Error in ${s}</h1><br /><br />
<code style="user-select:text;"><pre>
${r}
</pre></code>`,o.style.top="10px",o.style.left="10px",o.style.position="absolute",o.style.zIndex="9999",o.style.width="100%",o.style.textAlign="left",document.body.appendChild(o),document.getElementsByClassName("luma-compiler-log-error")[0]?.scrollIntoView(),o.onclick=()=>{const a=`data:text/plain,${encodeURIComponent(this.source)}`;navigator.clipboard.writeText(a)}}}function ss(e){return $e(e.source)||e.id||Fe(`unnamed ${e.stage}-shader`)}function $e(e,t="unnamed"){const s=/#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/.exec(e);return s?s[1]:t}class Ut extends F{static defaultProps={...F.defaultProps,type:"color-sampler",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",magFilter:"nearest",minFilter:"nearest",mipmapFilter:"none",lodMinClamp:0,lodMaxClamp:32,compare:"less-equal",maxAnisotropy:1};get[Symbol.toStringTag](){return"Sampler"}constructor(t,n){n=Ut.normalizeProps(t,n),super(t,n,Ut.defaultProps)}static normalizeProps(t,n){const s=t?.props?._resourceDefaults?.sampler||{};return{...n,...s}}}class We extends F{static defaultProps={...F.defaultProps,vs:null,vertexEntryPoint:"vertexMain",vsConstants:{},fs:null,fragmentEntryPoint:"fragmentMain",fsConstants:{},shaderLayout:null,bufferLayout:[],topology:"triangle-list",parameters:{},bindings:{},uniforms:{}};get[Symbol.toStringTag](){return"RenderPipeline"}shaderLayout;bufferLayout;linkStatus="pending";hash="";constructor(t,n){super(t,n,We.defaultProps),this.shaderLayout=this.props.shaderLayout,this.bufferLayout=this.props.bufferLayout||[]}setUniformsWebGL(t){throw new Error("Use uniform blocks")}}function rs(e){const[t,n]=os[e],s=t==="i32"||t==="u32",r=t!=="u32",i=cs[t]*n,o=is(t,n);return{dataType:t,components:n,defaultVertexFormat:o,byteLength:i,integer:s,signed:r}}function is(e,t){let n;switch(e){case"f32":n="float32";break;case"i32":n="sint32";break;case"u32":n="uint32";break;case"f16":return t<=2?"float16x2":"float16x4"}return t===1?n:`${n}x${t}`}const os={f32:["f32",1],"vec2<f32>":["f32",2],"vec3<f32>":["f32",3],"vec4<f32>":["f32",4],f16:["f16",1],"vec2<f16>":["f16",2],"vec3<f16>":["f16",3],"vec4<f16>":["f16",4],i32:["i32",1],"vec2<i32>":["i32",2],"vec3<i32>":["i32",3],"vec4<i32>":["i32",4],u32:["u32",1],"vec2<u32>":["u32",2],"vec3<u32>":["u32",3],"vec4<u32>":["u32",4]},cs={f32:4,f16:2,i32:4,u32:4};function Be(e){let t;e.endsWith("-webgl")&&(e.replace("-webgl",""),t=!0);const[n,s]=e.split("x"),r=n,i=s?parseInt(s):1,o=Zn(r),c={type:r,components:i,byteLength:o.byteLength*i,integer:o.integer,signed:o.signed,normalized:o.normalized};return t&&(c.webglOnly=!0),c}function as(e,t){const n={};for(const s of e.attributes){const r=ls(e,t,s.name);r&&(n[s.name]=r)}return n}function Ci(e,t,n=16){const s=as(e,t),r=new Array(n).fill(null);for(const i of Object.values(s))r[i.location]=i;return r}function ls(e,t,n){const s=fs(e,n),r=hs(t,n);if(!s)return null;const i=rs(s.type),o=r?.vertexFormat||i.defaultVertexFormat,c=Be(o);return{attributeName:r?.attributeName||s.name,bufferName:r?.bufferName||s.name,location:s.location,shaderType:s.type,shaderDataType:i.dataType,shaderComponents:i.components,vertexFormat:o,bufferDataType:c.type,bufferComponents:c.components,normalized:c.normalized,integer:i.integer,stepMode:r?.stepMode||s.stepMode||"vertex",byteOffset:r?.byteOffset||0,byteStride:r?.byteStride||0}}function fs(e,t){const n=e.attributes.find(s=>s.name===t);return n||Ht.warn(`shader layout attribute "${t}" not present in shader`),n||null}function hs(e,t){us(e);let n=ds(e,t);return n||(n=ps(e,t),n)?n:(Ht.warn(`layout for attribute "${t}" not present in buffer layout`),null)}function us(e){for(const t of e)(t.attributes&&t.format||!t.attributes&&!t.format)&&Ht.warn(`BufferLayout ${name} must have either 'attributes' or 'format' field`)}function ds(e,t){for(const n of e)if(n.format&&n.name===t)return{attributeName:n.name,bufferName:t,stepMode:n.stepMode,vertexFormat:n.format,byteOffset:0,byteStride:n.byteStride||0};return null}function ps(e,t){for(const n of e){let s=n.byteStride;if(typeof n.byteStride!="number")for(const i of n.attributes||[]){const o=Be(i.format);s+=o.byteLength}const r=n.attributes?.find(i=>i.attribute===t);if(r)return{attributeName:r.attribute,bufferName:n.name,stepMode:n.stepMode,vertexFormat:r.format,byteOffset:r.byteOffset,byteStride:s}}return null}let rt;function ms(e){return(!rt||rt.byteLength<e)&&(rt=new ArrayBuffer(e)),rt}function Di(e,t){const n=ms(e.BYTES_PER_ELEMENT*t);return new e(n,0,t)}const gs={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...gs}};const D=globalThis.mathgl.config;function _s(e,{precision:t=D.precision}={}){return e=ys(e),`${parseFloat(e.toPrecision(t))}`}function Z(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function mt(e,t,n){return Ms(e,s=>Math.max(t,Math.min(n,s)))}function Es(e,t,n){return Z(e)?e.map((s,r)=>Es(s,t[r],n)):n*t+(1-n)*e}function gt(e,t,n){const s=D.EPSILON;try{if(e===t)return!0;if(Z(e)&&Z(t)){if(e.length!==t.length)return!1;for(let r=0;r<e.length;++r)if(!gt(e[r],t[r]))return!1;return!0}return e&&e.equals?e.equals(t):t&&t.equals?t.equals(e):typeof e=="number"&&typeof t=="number"?Math.abs(e-t)<=D.EPSILON*Math.max(1,Math.abs(e),Math.abs(t)):!1}finally{D.EPSILON=s}}function ys(e){return Math.round(e/D.EPSILON)*D.EPSILON}function Ts(e){return e.clone?e.clone():new Array(e.length)}function Ms(e,t,n){if(Z(e)){const s=e;n=n||Ts(s);for(let r=0;r<n.length&&r<s.length;++r){const i=typeof e=="number"?e:e[r];n[r]=t(i,r,n)}return n}return t(e)}class Ve extends Array{clone(){return new this.constructor().copy(this)}fromArray(t,n=0){for(let s=0;s<this.ELEMENTS;++s)this[s]=t[s+n];return this.check()}toArray(t=[],n=0){for(let s=0;s<this.ELEMENTS;++s)t[n+s]=this[s];return t}toObject(t){return t}from(t){return Array.isArray(t)?this.copy(t):this.fromObject(t)}to(t){return t===this?this:Z(t)?this.toArray(t):this.toObject(t)}toTarget(t){return t?this.to(t):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(D)}formatString(t){let n="";for(let s=0;s<this.ELEMENTS;++s)n+=(s>0?", ":"")+_s(this[s],t);return`${t.printTypes?this.constructor.name:""}[${n}]`}equals(t){if(!t||this.length!==t.length)return!1;for(let n=0;n<this.ELEMENTS;++n)if(!gt(this[n],t[n]))return!1;return!0}exactEquals(t){if(!t||this.length!==t.length)return!1;for(let n=0;n<this.ELEMENTS;++n)if(this[n]!==t[n])return!1;return!0}negate(){for(let t=0;t<this.ELEMENTS;++t)this[t]=-this[t];return this.check()}lerp(t,n,s){if(s===void 0)return this.lerp(this,t,n);for(let r=0;r<this.ELEMENTS;++r){const i=t[r],o=typeof n=="number"?n:n[r];this[r]=i+s*(o-i)}return this.check()}min(t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(t[n],this[n]);return this.check()}max(t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.max(t[n],this[n]);return this.check()}clamp(t,n){for(let s=0;s<this.ELEMENTS;++s)this[s]=Math.min(Math.max(this[s],t[s]),n[s]);return this.check()}add(...t){for(const n of t)for(let s=0;s<this.ELEMENTS;++s)this[s]+=n[s];return this.check()}subtract(...t){for(const n of t)for(let s=0;s<this.ELEMENTS;++s)this[s]-=n[s];return this.check()}scale(t){if(typeof t=="number")for(let n=0;n<this.ELEMENTS;++n)this[n]*=t;else for(let n=0;n<this.ELEMENTS&&n<t.length;++n)this[n]*=t[n];return this.check()}multiplyByScalar(t){for(let n=0;n<this.ELEMENTS;++n)this[n]*=t;return this.check()}check(){if(D.debug&&!this.validate())throw new Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let t=this.length===this.ELEMENTS;for(let n=0;n<this.ELEMENTS;++n)t=t&&Number.isFinite(this[n]);return t}sub(t){return this.subtract(t)}setScalar(t){for(let n=0;n<this.ELEMENTS;++n)this[n]=t;return this.check()}addScalar(t){for(let n=0;n<this.ELEMENTS;++n)this[n]+=t;return this.check()}subScalar(t){return this.addScalar(-t)}multiplyScalar(t){for(let n=0;n<this.ELEMENTS;++n)this[n]*=t;return this.check()}divideScalar(t){return this.multiplyByScalar(1/t)}clampScalar(t,n){for(let s=0;s<this.ELEMENTS;++s)this[s]=Math.min(Math.max(this[s],t),n);return this.check()}get elements(){return this}}function vs(e,t){if(e.length!==t)return!1;for(let n=0;n<e.length;++n)if(!Number.isFinite(e[n]))return!1;return!0}function N(e){if(!Number.isFinite(e))throw new Error(`Invalid number ${JSON.stringify(e)}`);return e}function xt(e,t,n=""){if(D.debug&&!vs(e,t))throw new Error(`math.gl: ${n} some fields set to invalid numbers'`);return e}function ae(e,t){if(!e)throw new Error(`math.gl assertion ${t}`)}class Ss extends Ve{get x(){return this[0]}set x(t){this[0]=N(t)}get y(){return this[1]}set y(t){this[1]=N(t)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*this[n];return t}magnitudeSquared(){return this.lengthSquared()}distance(t){return Math.sqrt(this.distanceSquared(t))}distanceSquared(t){let n=0;for(let s=0;s<this.ELEMENTS;++s){const r=this[s]-t[s];n+=r*r}return N(n)}dot(t){let n=0;for(let s=0;s<this.ELEMENTS;++s)n+=this[s]*t[s];return N(n)}normalize(){const t=this.magnitude();if(t!==0)for(let n=0;n<this.ELEMENTS;++n)this[n]/=t;return this.check()}multiply(...t){for(const n of t)for(let s=0;s<this.ELEMENTS;++s)this[s]*=n[s];return this.check()}divide(...t){for(const n of t)for(let s=0;s<this.ELEMENTS;++s)this[s]/=n[s];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(t){return this.distance(t)}distanceToSquared(t){return this.distanceSquared(t)}getComponent(t){return ae(t>=0&&t<this.ELEMENTS,"index is out of range"),N(this[t])}setComponent(t,n){return ae(t>=0&&t<this.ELEMENTS,"index is out of range"),this[t]=n,this.check()}addVectors(t,n){return this.copy(t).add(n)}subVectors(t,n){return this.copy(t).subtract(n)}multiplyVectors(t,n){return this.copy(t).multiply(n)}addScaledVector(t,n){return this.add(new this.constructor(t).multiplyScalar(n))}}const ht=1e-6;let K=typeof Float32Array<"u"?Float32Array:Array;function As(){const e=new K(2);return K!=Float32Array&&(e[0]=0,e[1]=0),e}function le(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function Ls(e,t){return e[0]=-t[0],e[1]=-t[1],e}function Ye(e,t,n,s){const r=t[0],i=t[1];return e[0]=r+s*(n[0]-r),e[1]=i+s*(n[1]-i),e}function bs(e,t,n){const s=t[0],r=t[1];return e[0]=n[0]*s+n[4]*r+n[12],e[1]=n[1]*s+n[5]*r+n[13],e}(function(){const e=As();return function(t,n,s,r,i,o){let c,a;for(n||(n=2),s||(s=0),r?a=Math.min(r*n+s,t.length):a=t.length,c=s;c<a;c+=n)e[0]=t[c],e[1]=t[c+1],i(e,e,o),t[c]=e[0],t[c+1]=e[1];return t}})();function Os(e,t,n){const s=t[0],r=t[1],i=n[3]*s+n[7]*r||1;return e[0]=(n[0]*s+n[4]*r)/i,e[1]=(n[1]*s+n[5]*r)/i,e}function He(e,t,n){const s=t[0],r=t[1],i=t[2],o=n[3]*s+n[7]*r+n[11]*i||1;return e[0]=(n[0]*s+n[4]*r+n[8]*i)/o,e[1]=(n[1]*s+n[5]*r+n[9]*i)/o,e[2]=(n[2]*s+n[6]*r+n[10]*i)/o,e}function Rs(e,t,n){const s=t[0],r=t[1];return e[0]=n[0]*s+n[2]*r,e[1]=n[1]*s+n[3]*r,e[2]=t[2],e}function xs(){const e=new K(3);return K!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function Ps(e){const t=e[0],n=e[1],s=e[2];return Math.sqrt(t*t+n*n+s*s)}function ws(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function Is(e,t){const n=t[0]-e[0],s=t[1]-e[1],r=t[2]-e[2];return Math.sqrt(n*n+s*s+r*r)}function js(e){const t=e[0],n=e[1],s=e[2];return t*t+n*n+s*s}function Ns(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e}function Cs(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function Ds(e,t,n){const s=t[0],r=t[1],i=t[2],o=n[0],c=n[1],a=n[2];return e[0]=r*a-i*c,e[1]=i*o-s*a,e[2]=s*c-r*o,e}function Ui(e,t,n,s){const r=t[0],i=t[1],o=t[2];return e[0]=r+s*(n[0]-r),e[1]=i+s*(n[1]-i),e[2]=o+s*(n[2]-o),e}function Xe(e,t,n){const s=t[0],r=t[1],i=t[2];let o=n[3]*s+n[7]*r+n[11]*i+n[15];return o=o||1,e[0]=(n[0]*s+n[4]*r+n[8]*i+n[12])/o,e[1]=(n[1]*s+n[5]*r+n[9]*i+n[13])/o,e[2]=(n[2]*s+n[6]*r+n[10]*i+n[14])/o,e}function Us(e,t,n){const s=t[0],r=t[1],i=t[2];return e[0]=s*n[0]+r*n[3]+i*n[6],e[1]=s*n[1]+r*n[4]+i*n[7],e[2]=s*n[2]+r*n[5]+i*n[8],e}function Fs(e,t,n){const s=n[0],r=n[1],i=n[2],o=n[3],c=t[0],a=t[1],l=t[2];let f=r*l-i*a,h=i*c-s*l,u=s*a-r*c,d=r*u-i*h,m=i*f-s*u,p=s*h-r*f;const g=o*2;return f*=g,h*=g,u*=g,d*=2,m*=2,p*=2,e[0]=c+f+d,e[1]=a+h+m,e[2]=l+u+p,e}function zs(e,t,n,s){const r=[],i=[];return r[0]=t[0]-n[0],r[1]=t[1]-n[1],r[2]=t[2]-n[2],i[0]=r[0],i[1]=r[1]*Math.cos(s)-r[2]*Math.sin(s),i[2]=r[1]*Math.sin(s)+r[2]*Math.cos(s),e[0]=i[0]+n[0],e[1]=i[1]+n[1],e[2]=i[2]+n[2],e}function ks(e,t,n,s){const r=[],i=[];return r[0]=t[0]-n[0],r[1]=t[1]-n[1],r[2]=t[2]-n[2],i[0]=r[2]*Math.sin(s)+r[0]*Math.cos(s),i[1]=r[1],i[2]=r[2]*Math.cos(s)-r[0]*Math.sin(s),e[0]=i[0]+n[0],e[1]=i[1]+n[1],e[2]=i[2]+n[2],e}function Gs(e,t,n,s){const r=[],i=[];return r[0]=t[0]-n[0],r[1]=t[1]-n[1],r[2]=t[2]-n[2],i[0]=r[0]*Math.cos(s)-r[1]*Math.sin(s),i[1]=r[0]*Math.sin(s)+r[1]*Math.cos(s),i[2]=r[2],e[0]=i[0]+n[0],e[1]=i[1]+n[1],e[2]=i[2]+n[2],e}function $s(e,t){const n=e[0],s=e[1],r=e[2],i=t[0],o=t[1],c=t[2],a=Math.sqrt((n*n+s*s+r*r)*(i*i+o*o+c*c)),l=a&&Cs(e,t)/a;return Math.acos(Math.min(Math.max(l,-1),1))}const Fi=ws,zi=Is,ki=Ps,Gi=js;(function(){const e=xs();return function(t,n,s,r,i,o){let c,a;for(n||(n=3),s||(s=0),r?a=Math.min(r*n+s,t.length):a=t.length,c=s;c<a;c+=n)e[0]=t[c],e[1]=t[c+1],e[2]=t[c+2],i(e,e,o),t[c]=e[0],t[c+1]=e[1],t[c+2]=e[2];return t}})();const Pt=[0,0,0];let it;class J extends Ss{static get ZERO(){return it||(it=new J(0,0,0),Object.freeze(it)),it}constructor(t=0,n=0,s=0){super(-0,-0,-0),arguments.length===1&&Z(t)?this.copy(t):(D.debug&&(N(t),N(n),N(s)),this[0]=t,this[1]=n,this[2]=s)}set(t,n,s){return this[0]=t,this[1]=n,this[2]=s,this.check()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this.check()}fromObject(t){return D.debug&&(N(t.x),N(t.y),N(t.z)),this[0]=t.x,this[1]=t.y,this[2]=t.z,this.check()}toObject(t){return t.x=this[0],t.y=this[1],t.z=this[2],t}get ELEMENTS(){return 3}get z(){return this[2]}set z(t){this[2]=N(t)}angle(t){return $s(this,t)}cross(t){return Ds(this,this,t),this.check()}rotateX({radians:t,origin:n=Pt}){return zs(this,this,n,t),this.check()}rotateY({radians:t,origin:n=Pt}){return ks(this,this,n,t),this.check()}rotateZ({radians:t,origin:n=Pt}){return Gs(this,this,n,t),this.check()}transform(t){return this.transformAsPoint(t)}transformAsPoint(t){return Xe(this,this,t),this.check()}transformAsVector(t){return He(this,this,t),this.check()}transformByMatrix3(t){return Us(this,this,t),this.check()}transformByMatrix2(t){return Rs(this,this,t),this.check()}transformByQuaternion(t){return Fs(this,this,t),this.check()}}class Ws extends Ve{toString(){let t="[";if(D.printRowMajor){t+="row-major:";for(let n=0;n<this.RANK;++n)for(let s=0;s<this.RANK;++s)t+=` ${this[s*this.RANK+n]}`}else{t+="column-major:";for(let n=0;n<this.ELEMENTS;++n)t+=` ${this[n]}`}return t+="]",t}getElementIndex(t,n){return n*this.RANK+t}getElement(t,n){return this[n*this.RANK+t]}setElement(t,n,s){return this[n*this.RANK+t]=N(s),this}getColumn(t,n=new Array(this.RANK).fill(-0)){const s=t*this.RANK;for(let r=0;r<this.RANK;++r)n[r]=this[s+r];return n}setColumn(t,n){const s=t*this.RANK;for(let r=0;r<this.RANK;++r)this[s+r]=n[r];return this}}function Bs(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Vs(e,t){if(e===t){const n=t[1],s=t[2],r=t[3],i=t[6],o=t[7],c=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=s,e[9]=i,e[11]=t[14],e[12]=r,e[13]=o,e[14]=c}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}function Ft(e,t){const n=t[0],s=t[1],r=t[2],i=t[3],o=t[4],c=t[5],a=t[6],l=t[7],f=t[8],h=t[9],u=t[10],d=t[11],m=t[12],p=t[13],g=t[14],E=t[15],_=n*c-s*o,y=n*a-r*o,T=n*l-i*o,v=s*a-r*c,M=s*l-i*c,A=r*l-i*a,R=f*p-h*m,b=f*g-u*m,L=f*E-d*m,I=h*g-u*p,C=h*E-d*p,j=u*E-d*g;let O=_*j-y*C+T*I+v*L-M*b+A*R;return O?(O=1/O,e[0]=(c*j-a*C+l*I)*O,e[1]=(r*C-s*j-i*I)*O,e[2]=(p*A-g*M+E*v)*O,e[3]=(u*M-h*A-d*v)*O,e[4]=(a*L-o*j-l*b)*O,e[5]=(n*j-r*L+i*b)*O,e[6]=(g*T-m*A-E*y)*O,e[7]=(f*A-u*T+d*y)*O,e[8]=(o*C-c*L+l*R)*O,e[9]=(s*L-n*C-i*R)*O,e[10]=(m*M-p*T+E*_)*O,e[11]=(h*T-f*M-d*_)*O,e[12]=(c*b-o*I-a*R)*O,e[13]=(n*I-s*b+r*R)*O,e[14]=(p*y-m*v-g*_)*O,e[15]=(f*v-h*y+u*_)*O,e):null}function Ys(e){const t=e[0],n=e[1],s=e[2],r=e[3],i=e[4],o=e[5],c=e[6],a=e[7],l=e[8],f=e[9],h=e[10],u=e[11],d=e[12],m=e[13],p=e[14],g=e[15],E=t*o-n*i,_=t*c-s*i,y=n*c-s*o,T=l*m-f*d,v=l*p-h*d,M=f*p-h*m,A=t*M-n*v+s*T,R=i*M-o*v+c*T,b=l*y-f*_+h*E,L=d*y-m*_+p*E;return a*A-r*R+g*b-u*L}function W(e,t,n){const s=t[0],r=t[1],i=t[2],o=t[3],c=t[4],a=t[5],l=t[6],f=t[7],h=t[8],u=t[9],d=t[10],m=t[11],p=t[12],g=t[13],E=t[14],_=t[15];let y=n[0],T=n[1],v=n[2],M=n[3];return e[0]=y*s+T*c+v*h+M*p,e[1]=y*r+T*a+v*u+M*g,e[2]=y*i+T*l+v*d+M*E,e[3]=y*o+T*f+v*m+M*_,y=n[4],T=n[5],v=n[6],M=n[7],e[4]=y*s+T*c+v*h+M*p,e[5]=y*r+T*a+v*u+M*g,e[6]=y*i+T*l+v*d+M*E,e[7]=y*o+T*f+v*m+M*_,y=n[8],T=n[9],v=n[10],M=n[11],e[8]=y*s+T*c+v*h+M*p,e[9]=y*r+T*a+v*u+M*g,e[10]=y*i+T*l+v*d+M*E,e[11]=y*o+T*f+v*m+M*_,y=n[12],T=n[13],v=n[14],M=n[15],e[12]=y*s+T*c+v*h+M*p,e[13]=y*r+T*a+v*u+M*g,e[14]=y*i+T*l+v*d+M*E,e[15]=y*o+T*f+v*m+M*_,e}function _t(e,t,n){const s=n[0],r=n[1],i=n[2];let o,c,a,l,f,h,u,d,m,p,g,E;return t===e?(e[12]=t[0]*s+t[4]*r+t[8]*i+t[12],e[13]=t[1]*s+t[5]*r+t[9]*i+t[13],e[14]=t[2]*s+t[6]*r+t[10]*i+t[14],e[15]=t[3]*s+t[7]*r+t[11]*i+t[15]):(o=t[0],c=t[1],a=t[2],l=t[3],f=t[4],h=t[5],u=t[6],d=t[7],m=t[8],p=t[9],g=t[10],E=t[11],e[0]=o,e[1]=c,e[2]=a,e[3]=l,e[4]=f,e[5]=h,e[6]=u,e[7]=d,e[8]=m,e[9]=p,e[10]=g,e[11]=E,e[12]=o*s+f*r+m*i+t[12],e[13]=c*s+h*r+p*i+t[13],e[14]=a*s+u*r+g*i+t[14],e[15]=l*s+d*r+E*i+t[15]),e}function Xt(e,t,n){const s=n[0],r=n[1],i=n[2];return e[0]=t[0]*s,e[1]=t[1]*s,e[2]=t[2]*s,e[3]=t[3]*s,e[4]=t[4]*r,e[5]=t[5]*r,e[6]=t[6]*r,e[7]=t[7]*r,e[8]=t[8]*i,e[9]=t[9]*i,e[10]=t[10]*i,e[11]=t[11]*i,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e}function Hs(e,t,n,s){let r=s[0],i=s[1],o=s[2],c=Math.sqrt(r*r+i*i+o*o),a,l,f,h,u,d,m,p,g,E,_,y,T,v,M,A,R,b,L,I,C,j,O,tt;return c<ht?null:(c=1/c,r*=c,i*=c,o*=c,l=Math.sin(n),a=Math.cos(n),f=1-a,h=t[0],u=t[1],d=t[2],m=t[3],p=t[4],g=t[5],E=t[6],_=t[7],y=t[8],T=t[9],v=t[10],M=t[11],A=r*r*f+a,R=i*r*f+o*l,b=o*r*f-i*l,L=r*i*f-o*l,I=i*i*f+a,C=o*i*f+r*l,j=r*o*f+i*l,O=i*o*f-r*l,tt=o*o*f+a,e[0]=h*A+p*R+y*b,e[1]=u*A+g*R+T*b,e[2]=d*A+E*R+v*b,e[3]=m*A+_*R+M*b,e[4]=h*L+p*I+y*C,e[5]=u*L+g*I+T*C,e[6]=d*L+E*I+v*C,e[7]=m*L+_*I+M*C,e[8]=h*j+p*O+y*tt,e[9]=u*j+g*O+T*tt,e[10]=d*j+E*O+v*tt,e[11]=m*j+_*O+M*tt,t!==e&&(e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e)}function qe(e,t,n){const s=Math.sin(n),r=Math.cos(n),i=t[4],o=t[5],c=t[6],a=t[7],l=t[8],f=t[9],h=t[10],u=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=i*r+l*s,e[5]=o*r+f*s,e[6]=c*r+h*s,e[7]=a*r+u*s,e[8]=l*r-i*s,e[9]=f*r-o*s,e[10]=h*r-c*s,e[11]=u*r-a*s,e}function Xs(e,t,n){const s=Math.sin(n),r=Math.cos(n),i=t[0],o=t[1],c=t[2],a=t[3],l=t[8],f=t[9],h=t[10],u=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=i*r-l*s,e[1]=o*r-f*s,e[2]=c*r-h*s,e[3]=a*r-u*s,e[8]=i*s+l*r,e[9]=o*s+f*r,e[10]=c*s+h*r,e[11]=a*s+u*r,e}function Ze(e,t,n){const s=Math.sin(n),r=Math.cos(n),i=t[0],o=t[1],c=t[2],a=t[3],l=t[4],f=t[5],h=t[6],u=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=i*r+l*s,e[1]=o*r+f*s,e[2]=c*r+h*s,e[3]=a*r+u*s,e[4]=l*r-i*s,e[5]=f*r-o*s,e[6]=h*r-c*s,e[7]=u*r-a*s,e}function qs(e,t){const n=t[0],s=t[1],r=t[2],i=t[3],o=n+n,c=s+s,a=r+r,l=n*o,f=s*o,h=s*c,u=r*o,d=r*c,m=r*a,p=i*o,g=i*c,E=i*a;return e[0]=1-h-m,e[1]=f+E,e[2]=u-g,e[3]=0,e[4]=f-E,e[5]=1-l-m,e[6]=d+p,e[7]=0,e[8]=u+g,e[9]=d-p,e[10]=1-l-h,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function Zs(e,t,n,s,r,i,o){const c=1/(n-t),a=1/(r-s),l=1/(i-o);return e[0]=i*2*c,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=i*2*a,e[6]=0,e[7]=0,e[8]=(n+t)*c,e[9]=(r+s)*a,e[10]=(o+i)*l,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*i*2*l,e[15]=0,e}function Ks(e,t,n,s,r){const i=1/Math.tan(t/2);if(e[0]=i/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=i,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,r!=null&&r!==1/0){const o=1/(s-r);e[10]=(r+s)*o,e[14]=2*r*s*o}else e[10]=-1,e[14]=-2*s;return e}const Js=Ks;function Qs(e,t,n,s,r,i,o){const c=1/(t-n),a=1/(s-r),l=1/(i-o);return e[0]=-2*c,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*l,e[11]=0,e[12]=(t+n)*c,e[13]=(r+s)*a,e[14]=(o+i)*l,e[15]=1,e}const tr=Qs;function er(e,t,n,s){let r,i,o,c,a,l,f,h,u,d;const m=t[0],p=t[1],g=t[2],E=s[0],_=s[1],y=s[2],T=n[0],v=n[1],M=n[2];return Math.abs(m-T)<ht&&Math.abs(p-v)<ht&&Math.abs(g-M)<ht?Bs(e):(h=m-T,u=p-v,d=g-M,r=1/Math.sqrt(h*h+u*u+d*d),h*=r,u*=r,d*=r,i=_*d-y*u,o=y*h-E*d,c=E*u-_*h,r=Math.sqrt(i*i+o*o+c*c),r?(r=1/r,i*=r,o*=r,c*=r):(i=0,o=0,c=0),a=u*c-d*o,l=d*i-h*c,f=h*o-u*i,r=Math.sqrt(a*a+l*l+f*f),r?(r=1/r,a*=r,l*=r,f*=r):(a=0,l=0,f=0),e[0]=i,e[1]=a,e[2]=h,e[3]=0,e[4]=o,e[5]=l,e[6]=u,e[7]=0,e[8]=c,e[9]=f,e[10]=d,e[11]=0,e[12]=-(i*m+o*p+c*g),e[13]=-(a*m+l*p+f*g),e[14]=-(h*m+u*p+d*g),e[15]=1,e)}function nr(){const e=new K(4);return K!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0,e[3]=0),e}function sr(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e}function St(e,t,n){const s=t[0],r=t[1],i=t[2],o=t[3];return e[0]=n[0]*s+n[4]*r+n[8]*i+n[12]*o,e[1]=n[1]*s+n[5]*r+n[9]*i+n[13]*o,e[2]=n[2]*s+n[6]*r+n[10]*i+n[14]*o,e[3]=n[3]*s+n[7]*r+n[11]*i+n[15]*o,e}(function(){const e=nr();return function(t,n,s,r,i,o){let c,a;for(n||(n=4),s||(s=0),r?a=Math.min(r*n+s,t.length):a=t.length,c=s;c<a;c+=n)e[0]=t[c],e[1]=t[c+1],e[2]=t[c+2],e[3]=t[c+3],i(e,e,o),t[c]=e[0],t[c+1]=e[1],t[c+2]=e[2],t[c+3]=e[3];return t}})();var zt;(function(e){e[e.COL0ROW0=0]="COL0ROW0",e[e.COL0ROW1=1]="COL0ROW1",e[e.COL0ROW2=2]="COL0ROW2",e[e.COL0ROW3=3]="COL0ROW3",e[e.COL1ROW0=4]="COL1ROW0",e[e.COL1ROW1=5]="COL1ROW1",e[e.COL1ROW2=6]="COL1ROW2",e[e.COL1ROW3=7]="COL1ROW3",e[e.COL2ROW0=8]="COL2ROW0",e[e.COL2ROW1=9]="COL2ROW1",e[e.COL2ROW2=10]="COL2ROW2",e[e.COL2ROW3=11]="COL2ROW3",e[e.COL3ROW0=12]="COL3ROW0",e[e.COL3ROW1=13]="COL3ROW1",e[e.COL3ROW2=14]="COL3ROW2",e[e.COL3ROW3=15]="COL3ROW3"})(zt||(zt={}));const rr=45*Math.PI/180,ir=1,wt=.1,It=500,or=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class B extends Ws{static get IDENTITY(){return ar()}static get ZERO(){return cr()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return zt}constructor(t){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(t)?this.copy(t):this.identity()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this[4]=t[4],this[5]=t[5],this[6]=t[6],this[7]=t[7],this[8]=t[8],this[9]=t[9],this[10]=t[10],this[11]=t[11],this[12]=t[12],this[13]=t[13],this[14]=t[14],this[15]=t[15],this.check()}set(t,n,s,r,i,o,c,a,l,f,h,u,d,m,p,g){return this[0]=t,this[1]=n,this[2]=s,this[3]=r,this[4]=i,this[5]=o,this[6]=c,this[7]=a,this[8]=l,this[9]=f,this[10]=h,this[11]=u,this[12]=d,this[13]=m,this[14]=p,this[15]=g,this.check()}setRowMajor(t,n,s,r,i,o,c,a,l,f,h,u,d,m,p,g){return this[0]=t,this[1]=i,this[2]=l,this[3]=d,this[4]=n,this[5]=o,this[6]=f,this[7]=m,this[8]=s,this[9]=c,this[10]=h,this[11]=p,this[12]=r,this[13]=a,this[14]=u,this[15]=g,this.check()}toRowMajor(t){return t[0]=this[0],t[1]=this[4],t[2]=this[8],t[3]=this[12],t[4]=this[1],t[5]=this[5],t[6]=this[9],t[7]=this[13],t[8]=this[2],t[9]=this[6],t[10]=this[10],t[11]=this[14],t[12]=this[3],t[13]=this[7],t[14]=this[11],t[15]=this[15],t}identity(){return this.copy(or)}fromObject(t){return this.check()}fromQuaternion(t){return qs(this,t),this.check()}frustum(t){const{left:n,right:s,bottom:r,top:i,near:o=wt,far:c=It}=t;return c===1/0?lr(this,n,s,r,i,o):Zs(this,n,s,r,i,o,c),this.check()}lookAt(t){const{eye:n,center:s=[0,0,0],up:r=[0,1,0]}=t;return er(this,n,s,r),this.check()}ortho(t){const{left:n,right:s,bottom:r,top:i,near:o=wt,far:c=It}=t;return tr(this,n,s,r,i,o,c),this.check()}orthographic(t){const{fovy:n=rr,aspect:s=ir,focalDistance:r=1,near:i=wt,far:o=It}=t;fe(n);const c=n/2,a=r*Math.tan(c),l=a*s;return this.ortho({left:-l,right:l,bottom:-a,top:a,near:i,far:o})}perspective(t){const{fovy:n=45*Math.PI/180,aspect:s=1,near:r=.1,far:i=500}=t;return fe(n),Js(this,n,s,r,i),this.check()}determinant(){return Ys(this)}getScale(t=[-0,-0,-0]){return t[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),t[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),t[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),t}getTranslation(t=[-0,-0,-0]){return t[0]=this[12],t[1]=this[13],t[2]=this[14],t}getRotation(t,n){t=t||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],n=n||[-0,-0,-0];const s=this.getScale(n),r=1/s[0],i=1/s[1],o=1/s[2];return t[0]=this[0]*r,t[1]=this[1]*i,t[2]=this[2]*o,t[3]=0,t[4]=this[4]*r,t[5]=this[5]*i,t[6]=this[6]*o,t[7]=0,t[8]=this[8]*r,t[9]=this[9]*i,t[10]=this[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}getRotationMatrix3(t,n){t=t||[-0,-0,-0,-0,-0,-0,-0,-0,-0],n=n||[-0,-0,-0];const s=this.getScale(n),r=1/s[0],i=1/s[1],o=1/s[2];return t[0]=this[0]*r,t[1]=this[1]*i,t[2]=this[2]*o,t[3]=this[4]*r,t[4]=this[5]*i,t[5]=this[6]*o,t[6]=this[8]*r,t[7]=this[9]*i,t[8]=this[10]*o,t}transpose(){return Vs(this,this),this.check()}invert(){return Ft(this,this),this.check()}multiplyLeft(t){return W(this,t,this),this.check()}multiplyRight(t){return W(this,this,t),this.check()}rotateX(t){return qe(this,this,t),this.check()}rotateY(t){return Xs(this,this,t),this.check()}rotateZ(t){return Ze(this,this,t),this.check()}rotateXYZ(t){return this.rotateX(t[0]).rotateY(t[1]).rotateZ(t[2])}rotateAxis(t,n){return Hs(this,this,t,n),this.check()}scale(t){return Xt(this,this,Array.isArray(t)?t:[t,t,t]),this.check()}translate(t){return _t(this,this,t),this.check()}transform(t,n){return t.length===4?(n=St(n||[-0,-0,-0,-0],t,this),xt(n,4),n):this.transformAsPoint(t,n)}transformAsPoint(t,n){const{length:s}=t;let r;switch(s){case 2:r=bs(n||[-0,-0],t,this);break;case 3:r=Xe(n||[-0,-0,-0],t,this);break;default:throw new Error("Illegal vector")}return xt(r,t.length),r}transformAsVector(t,n){let s;switch(t.length){case 2:s=Os(n||[-0,-0],t,this);break;case 3:s=He(n||[-0,-0,-0],t,this);break;default:throw new Error("Illegal vector")}return xt(s,t.length),s}transformPoint(t,n){return this.transformAsPoint(t,n)}transformVector(t,n){return this.transformAsPoint(t,n)}transformDirection(t,n){return this.transformAsVector(t,n)}makeRotationX(t){return this.identity().rotateX(t)}makeTranslation(t,n,s){return this.identity().translate([t,n,s])}}let ot,ct;function cr(){return ot||(ot=new B([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(ot)),ot}function ar(){return ct||(ct=new B,Object.freeze(ct)),ct}function fe(e){if(e>Math.PI*2)throw Error("expected radians")}function lr(e,t,n,s,r,i){const o=2*i/(n-t),c=2*i/(r-s),a=(n+t)/(n-t),l=(r+s)/(r-s),f=-1,h=-1,u=-2*i;return e[0]=o,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=c,e[6]=0,e[7]=0,e[8]=a,e[9]=l,e[10]=f,e[11]=h,e[12]=0,e[13]=0,e[14]=u,e[15]=0,e}const fr=`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`,hr={name:"fp32",vs:fr},ur=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,Ke="#define SMOOTH_EDGE_RADIUS 0.5",dr=`${Ke}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,pr=`${Ke}

struct FragmentGeometry {
  vec2 uv;
} geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,mr={name:"geometry",source:ur,vs:dr,fs:pr},gr=25;var x;(function(e){e[e.Start=1]="Start",e[e.Move=2]="Move",e[e.End=4]="End",e[e.Cancel=8]="Cancel"})(x||(x={}));var P;(function(e){e[e.None=0]="None",e[e.Left=1]="Left",e[e.Right=2]="Right",e[e.Up=4]="Up",e[e.Down=8]="Down",e[e.Horizontal=3]="Horizontal",e[e.Vertical=12]="Vertical",e[e.All=15]="All"})(P||(P={}));var S;(function(e){e[e.Possible=1]="Possible",e[e.Began=2]="Began",e[e.Changed=4]="Changed",e[e.Ended=8]="Ended",e[e.Recognized=8]="Recognized",e[e.Cancelled=16]="Cancelled",e[e.Failed=32]="Failed"})(S||(S={}));const $i="compute",Wi="auto",_r="manipulation",Er="none",yr="pan-x",Tr="pan-y";function Je(e){return e.trim().split(/\s+/g)}function jt(e,t,n){if(e)for(const s of Je(t))e.addEventListener(s,n,!1)}function Nt(e,t,n){if(e)for(const s of Je(t))e.removeEventListener(s,n,!1)}function he(e){return(e.ownerDocument||e).defaultView}function Mr(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function Qe(e){const t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,s=0,r=0;for(;r<t;)n+=e[r].clientX,s+=e[r].clientY,r++;return{x:Math.round(n/t),y:Math.round(s/t)}}function ue(e){const t=[];let n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:Qe(t),deltaX:e.deltaX,deltaY:e.deltaY}}function tn(e,t){const n=t.x-e.x,s=t.y-e.y;return Math.sqrt(n*n+s*s)}function de(e,t){const n=t.clientX-e.clientX,s=t.clientY-e.clientY;return Math.sqrt(n*n+s*s)}function vr(e,t){const n=t.x-e.x,s=t.y-e.y;return Math.atan2(s,n)*180/Math.PI}function pe(e,t){const n=t.clientX-e.clientX,s=t.clientY-e.clientY;return Math.atan2(s,n)*180/Math.PI}function en(e,t){return e===t?P.None:Math.abs(e)>=Math.abs(t)?e<0?P.Left:P.Right:t<0?P.Up:P.Down}function Sr(e,t){const n=t.center;let s=e.offsetDelta,r=e.prevDelta;const i=e.prevInput;return(t.eventType===x.Start||i?.eventType===x.End)&&(r=e.prevDelta={x:i?.deltaX||0,y:i?.deltaY||0},s=e.offsetDelta={x:n.x,y:n.y}),{deltaX:r.x+(n.x-s.x),deltaY:r.y+(n.y-s.y)}}function nn(e,t,n){return{x:t/e||0,y:n/e||0}}function Ar(e,t){return de(t[0],t[1])/de(e[0],e[1])}function Lr(e,t){return pe(t[1],t[0])-pe(e[1],e[0])}function br(e,t){const n=e.lastInterval||t,s=t.timeStamp-n.timeStamp;let r,i,o,c;if(t.eventType!==x.Cancel&&(s>gr||n.velocity===void 0)){const a=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,f=nn(s,a,l);i=f.x,o=f.y,r=Math.abs(f.x)>Math.abs(f.y)?f.x:f.y,c=en(a,l),e.lastInterval=t}else r=n.velocity,i=n.velocityX,o=n.velocityY,c=n.direction;t.velocity=r,t.velocityX=i,t.velocityY=o,t.direction=c}function Or(e,t){const{session:n}=e,{pointers:s}=t,{length:r}=s;n.firstInput||(n.firstInput=ue(t)),r>1&&!n.firstMultiple?n.firstMultiple=ue(t):r===1&&(n.firstMultiple=!1);const{firstInput:i,firstMultiple:o}=n,c=o?o.center:i.center,a=t.center=Qe(s);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-i.timeStamp,t.angle=vr(c,a),t.distance=tn(c,a);const{deltaX:l,deltaY:f}=Sr(n,t);t.deltaX=l,t.deltaY=f,t.offsetDirection=en(t.deltaX,t.deltaY);const h=nn(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=h.x,t.overallVelocityY=h.y,t.overallVelocity=Math.abs(h.x)>Math.abs(h.y)?h.x:h.y,t.scale=o?Ar(o.pointers,s):1,t.rotation=o?Lr(o.pointers,s):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let u=e.element;return Mr(t.srcEvent.target,u)&&(u=t.srcEvent.target),t.target=u,br(n,t),t}function Rr(e,t,n){const s=n.pointers.length,r=n.changedPointers.length,i=t&x.Start&&s-r===0,o=t&(x.End|x.Cancel)&&s-r===0;n.isFirst=!!i,n.isFinal=!!o,i&&(e.session={}),n.eventType=t;const c=Or(e,n);e.emit("hammer.input",c),e.recognize(c),e.session.prevInput=c}let xr=class{constructor(t){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=n=>{this.manager.options.enable&&this.handler(n)},this.manager=t,this.element=t.element,this.target=t.options.inputTarget||t.element}callback(t,n){Rr(this.manager,t,n)}init(){jt(this.element,this.evEl,this.domHandler),jt(this.target,this.evTarget,this.domHandler),jt(he(this.element),this.evWin,this.domHandler)}destroy(){Nt(this.element,this.evEl,this.domHandler),Nt(this.target,this.evTarget,this.domHandler),Nt(he(this.element),this.evWin,this.domHandler)}};const Pr={pointerdown:x.Start,pointermove:x.Move,pointerup:x.End,pointercancel:x.Cancel,pointerout:x.Cancel},wr="pointerdown",Ir="pointermove pointerup pointercancel";class Vi extends xr{constructor(t){super(t),this.evEl=wr,this.evWin=Ir,this.store=this.manager.session.pointerEvents=[],this.init()}handler(t){const{store:n}=this;let s=!1;const r=Pr[t.type],i=t.pointerType,o=i==="touch";let c=n.findIndex(a=>a.pointerId===t.pointerId);r&x.Start&&(t.buttons||o)?c<0&&(n.push(t),c=n.length-1):r&(x.End|x.Cancel)&&(s=!0),!(c<0)&&(n[c]=t,this.callback(r,{pointers:n,changedPointers:[t],eventType:r,pointerType:i,srcEvent:t}),s&&n.splice(c,1))}}let jr=1;function Nr(){return jr++}function me(e){return e&S.Cancelled?"cancel":e&S.Ended?"end":e&S.Changed?"move":e&S.Began?"start":""}class sn{constructor(t){this.options=t,this.id=Nr(),this.state=S.Possible,this.simultaneous={},this.requireFail=[]}set(t){return Object.assign(this.options,t),this.manager.touchAction.update(),this}recognizeWith(t){if(Array.isArray(t)){for(const r of t)this.recognizeWith(r);return this}let n;if(typeof t=="string"){if(n=this.manager.get(t),!n)throw new Error(`Cannot find recognizer ${t}`)}else n=t;const{simultaneous:s}=this;return s[n.id]||(s[n.id]=n,n.recognizeWith(this)),this}dropRecognizeWith(t){if(Array.isArray(t)){for(const s of t)this.dropRecognizeWith(s);return this}let n;return typeof t=="string"?n=this.manager.get(t):n=t,n&&delete this.simultaneous[n.id],this}requireFailure(t){if(Array.isArray(t)){for(const r of t)this.requireFailure(r);return this}let n;if(typeof t=="string"){if(n=this.manager.get(t),!n)throw new Error(`Cannot find recognizer ${t}`)}else n=t;const{requireFail:s}=this;return s.indexOf(n)===-1&&(s.push(n),n.requireFailure(this)),this}dropRequireFailure(t){if(Array.isArray(t)){for(const s of t)this.dropRequireFailure(s);return this}let n;if(typeof t=="string"?n=this.manager.get(t):n=t,n){const s=this.requireFail.indexOf(n);s>-1&&this.requireFail.splice(s,1)}return this}hasRequireFailures(){return!!this.requireFail.find(t=>t.options.enable)}canRecognizeWith(t){return!!this.simultaneous[t.id]}emit(t){if(!t)return;const{state:n}=this;n<S.Ended&&this.manager.emit(this.options.event+me(n),t),this.manager.emit(this.options.event,t),t.additionalEvent&&this.manager.emit(t.additionalEvent,t),n>=S.Ended&&this.manager.emit(this.options.event+me(n),t)}tryEmit(t){this.canEmit()?this.emit(t):this.state=S.Failed}canEmit(){let t=0;for(;t<this.requireFail.length;){if(!(this.requireFail[t].state&(S.Failed|S.Possible)))return!1;t++}return!0}recognize(t){const n={...t};if(!this.options.enable){this.reset(),this.state=S.Failed;return}this.state&(S.Recognized|S.Cancelled|S.Failed)&&(this.state=S.Possible),this.state=this.process(n),this.state&(S.Began|S.Changed|S.Ended|S.Cancelled)&&this.tryEmit(n)}getEventNames(){return[this.options.event]}reset(){}}class rn extends sn{attrTest(t){const n=this.options.pointers;return n===0||t.pointers.length===n}process(t){const{state:n}=this,{eventType:s}=t,r=n&(S.Began|S.Changed),i=this.attrTest(t);return r&&(s&x.Cancel||!i)?n|S.Cancelled:r||i?s&x.End?n|S.Ended:n&S.Began?n|S.Changed:S.Began:S.Failed}}class ge extends sn{constructor(t={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...t}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[_r]}process(t){const{options:n}=this,s=t.pointers.length===n.pointers,r=t.distance<n.threshold,i=t.deltaTime<n.time;if(this.reset(),t.eventType&x.Start&&this.count===0)return this.failTimeout();if(r&&i&&s){if(t.eventType!==x.End)return this.failTimeout();const o=this.pTime?t.timeStamp-this.pTime<n.interval:!0,c=!this.pCenter||tn(this.pCenter,t.center)<n.posThreshold;if(this.pTime=t.timeStamp,this.pCenter=t.center,!c||!o?this.count=1:this.count+=1,this._input=t,this.count%n.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=S.Recognized,this.tryEmit(this._input)},n.interval),S.Began):S.Recognized}return S.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=S.Failed},this.options.interval),S.Failed}reset(){clearTimeout(this._timer)}emit(t){this.state===S.Recognized&&(t.tapCount=this.count,this.manager.emit(this.options.event,t))}}const Cr=["","start","move","end","cancel","up","down","left","right"];class _e extends rn{constructor(t={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:P.All,...t}),this.pX=null,this.pY=null}getTouchAction(){const{options:{direction:t}}=this,n=[];return t&P.Horizontal&&n.push(Tr),t&P.Vertical&&n.push(yr),n}getEventNames(){return Cr.map(t=>this.options.event+t)}directionTest(t){const{options:n}=this;let s=!0,{distance:r}=t,{direction:i}=t;const o=t.deltaX,c=t.deltaY;return i&n.direction||(n.direction&P.Horizontal?(i=o===0?P.None:o<0?P.Left:P.Right,s=o!==this.pX,r=Math.abs(t.deltaX)):(i=c===0?P.None:c<0?P.Up:P.Down,s=c!==this.pY,r=Math.abs(t.deltaY))),t.direction=i,s&&r>n.threshold&&!!(i&n.direction)}attrTest(t){return super.attrTest(t)&&(!!(this.state&S.Began)||!(this.state&S.Began)&&this.directionTest(t))}emit(t){this.pX=t.deltaX,this.pY=t.deltaY;const n=P[t.direction].toLowerCase();n&&(t.additionalEvent=this.options.event+n),super.emit(t)}}const Dr=["","start","move","end","cancel","in","out"];class Ur extends rn{constructor(t={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,...t})}getTouchAction(){return[Er]}getEventNames(){return Dr.map(t=>this.options.event+t)}attrTest(t){return super.attrTest(t)&&(Math.abs(t.scale-1)>this.options.threshold||!!(this.state&S.Began))}emit(t){if(t.scale!==1){const n=t.scale<1?"in":"out";t.additionalEvent=this.options.event+n}super.emit(t)}}class Fr{constructor(t,n,s){this.element=t,this.callback=n,this.options=s}}const zr=typeof navigator<"u"&&navigator.userAgent?navigator.userAgent.toLowerCase():"",kr=zr.indexOf("firefox")!==-1,Ee=4.000244140625,Gr=40,$r=.25;class Yi extends Fr{constructor(t,n,s){super(t,n,{enable:!0,...s}),this.handleEvent=r=>{if(!this.options.enable)return;let i=r.deltaY;globalThis.WheelEvent&&(kr&&r.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(i/=globalThis.devicePixelRatio),r.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(i*=Gr)),i!==0&&i%Ee===0&&(i=Math.floor(i/Ee)),r.shiftKey&&i&&(i=i*$r),this.callback({type:"wheel",center:{x:r.clientX,y:r.clientY},delta:-i,srcEvent:r,pointerType:"mouse",target:r.target})},t.addEventListener("wheel",this.handleEvent,{passive:!1})}destroy(){this.element.removeEventListener("wheel",this.handleEvent)}enableEventType(t,n){t==="wheel"&&(this.options.enable=n)}}const w={DEFAULT:-1,LNGLAT:1,METER_OFFSETS:2,LNGLAT_OFFSETS:3,CARTESIAN:0};Object.defineProperty(w,"IDENTITY",{get:()=>(Re.deprecated("COORDINATE_SYSTEM.IDENTITY","COORDINATE_SYSTEM.CARTESIAN")(),0)});const z={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},Et={common:0,meters:1,pixels:2},Hi={click:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},Xi={multipan:[_e,{threshold:10,direction:P.Vertical,pointers:2}],pinch:[Ur,{},null,["multipan"]],pan:[_e,{threshold:1},["pinch"],["multipan"]],dblclick:[ge,{event:"dblclick",taps:2}],click:[ge,{event:"click"},null,["dblclick"]]};function Wr(e,t){if(e===t)return!0;if(Array.isArray(e)){const n=e.length;if(!t||t.length!==n)return!1;for(let s=0;s<n;s++)if(e[s]!==t[s])return!1;return!0}return!1}function Br(e){let t={},n;return s=>{for(const r in s)if(!Wr(s[r],t[r])){n=e(s),t=s;break}return n}}const ye=[0,0,0,0],Vr=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],on=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Yr=[0,0,0],cn=[0,0,0],Hr=Br(Kr);function Xr(e,t,n=cn){n.length<3&&(n=[n[0],n[1],0]);let s=n,r,i=!0;switch(t===w.LNGLAT_OFFSETS||t===w.METER_OFFSETS?r=n:r=e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case z.WEB_MERCATOR:(t===w.LNGLAT||t===w.CARTESIAN)&&(r=[0,0,0],i=!1);break;case z.WEB_MERCATOR_AUTO_OFFSET:t===w.LNGLAT?s=r:t===w.CARTESIAN&&(s=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],r=e.unprojectPosition(s),s[0]-=n[0],s[1]-=n[1],s[2]-=n[2]);break;case z.IDENTITY:s=e.position.map(Math.fround),s[2]=s[2]||0;break;case z.GLOBE:i=!1,r=null;break;default:i=!1}return{geospatialOrigin:r,shaderCoordinateOrigin:s,offsetMode:i}}function qr(e,t,n){const{viewMatrixUncentered:s,projectionMatrix:r}=e;let{viewMatrix:i,viewProjectionMatrix:o}=e,c=ye,a=ye,l=e.cameraPosition;const{geospatialOrigin:f,shaderCoordinateOrigin:h,offsetMode:u}=Xr(e,t,n);return u&&(a=e.projectPosition(f||h),l=[l[0]-a[0],l[1]-a[1],l[2]-a[2]],a[3]=1,c=St([],a,o),i=s||i,o=W([],r,i),o=W([],o,Vr)),{viewMatrix:i,viewProjectionMatrix:o,projectionCenter:c,originCommon:a,cameraPosCommon:l,shaderCoordinateOrigin:h,geospatialOrigin:f}}function Zr({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:s=w.DEFAULT,coordinateOrigin:r=cn,autoWrapLongitude:i=!1}){s===w.DEFAULT&&(s=e.isGeospatial?w.LNGLAT:w.CARTESIAN);const o=Hr({viewport:e,devicePixelRatio:t,coordinateSystem:s,coordinateOrigin:r});return o.wrapLongitude=i,o.modelMatrix=n||on,o}function Kr({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:s}){const{projectionCenter:r,viewProjectionMatrix:i,originCommon:o,cameraPosCommon:c,shaderCoordinateOrigin:a,geospatialOrigin:l}=qr(e,n,s),f=e.getDistanceScales(),h=[e.width*t,e.height*t],u=St([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,d={coordinateSystem:n,projectionMode:e.projectionMode,coordinateOrigin:a,commonOrigin:o.slice(0,3),center:r,pseudoMeters:!!e._pseudoMeters,viewportSize:h,devicePixelRatio:t,focalDistance:u,commonUnitsPerMeter:f.unitsPerMeter,commonUnitsPerWorldUnit:f.unitsPerMeter,commonUnitsPerWorldUnit2:Yr,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:i,modelMatrix:on,cameraPosition:c};if(l){const m=e.getDistanceScales(l);switch(n){case w.METER_OFFSETS:d.commonUnitsPerWorldUnit=m.unitsPerMeter,d.commonUnitsPerWorldUnit2=m.unitsPerMeter2;break;case w.LNGLAT:case w.LNGLAT_OFFSETS:e._pseudoMeters||(d.commonUnitsPerMeter=m.unitsPerMeter),d.commonUnitsPerWorldUnit=m.unitsPerDegree,d.commonUnitsPerWorldUnit2=m.unitsPerDegree2;break;case w.CARTESIAN:d.commonUnitsPerWorldUnit=[1,1,m.unitsPerMeter[2]],d.commonUnitsPerWorldUnit2=[0,0,m.unitsPerMeter2[2]];break}}return d}const Jr=Object.keys(w).map(e=>`const COORDINATE_SYSTEM_${e}: i32 = ${w[e]};`).join(""),Qr=Object.keys(z).map(e=>`const PROJECTION_MODE_${e}: i32 = ${z[e]};`).join(""),ti=Object.keys(Et).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${Et[e]};`).join(""),ei=`${Jr}
${Qr}
${ti}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(0)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data
// (In your GLSL code, "geometry" was assumed to be available globally. In WGSL,
// you might supply this via vertex attributes or a uniform. Here we define a
// uniform struct for demonstration.)
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

// @group(0) @binding(1)
var<private> geometry: Geometry;
`,ni=`${ei}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z‑axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  let ux = select(
    vec3<f32>(1.0, 0.0, 0.0),
    normalize(vec3<f32>(uz.y, -uz.x, 0.0)),
    abs(uz.z) == 1.0
  );
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  return viewProjectionMatrix * position + center;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`,si=Object.keys(w).map(e=>`const int COORDINATE_SYSTEM_${e} = ${w[e]};`).join(""),ri=Object.keys(z).map(e=>`const int PROJECTION_MODE_${e} = ${z[e]};`).join(""),ii=Object.keys(Et).map(e=>`const int UNIT_${e.toUpperCase()} = ${Et[e]};`).join(""),oi=`${si}
${ri}
${ii}
uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`,ci={};function ai(e=ci){return"viewport"in e?Zr(e):{}}const qi={name:"project",dependencies:[hr,mr],source:ni,vs:oi,getUniforms:ai,uniformTypes:{wrapLongitude:"f32",coordinateSystem:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32"}};function li(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function q(e,t){const n=St([],t,e);return sr(n,n,1/n[3]),n}function Zi(e,t){const n=e%t;return n<0?t+n:n}function kt(e,t,n){return e<t?t:e>n?n:e}function fi(e){return Math.log(e)*Math.LOG2E}const an=Math.log2||fi;function G(e,t){if(!e)throw new Error(t||"@math.gl/web-mercator: assertion failed.")}const k=Math.PI,ln=k/4,U=k/180,Gt=180/k,Q=512,yt=4003e4,at=85.051129,hi=1.5;function ui(e){return an(e)}function Tt(e){const[t,n]=e;G(Number.isFinite(t)),G(Number.isFinite(n)&&n>=-90&&n<=90,"invalid latitude");const s=t*U,r=n*U,i=Q*(s+k)/(2*k),o=Q*(k+Math.log(Math.tan(ln+r*.5)))/(2*k);return[i,o]}function At(e){const[t,n]=e,s=t/Q*(2*k)-k,r=2*(Math.atan(Math.exp(n/Q*(2*k)-k))-ln);return[s*Gt,r*Gt]}function di(e){const{latitude:t}=e;G(Number.isFinite(t));const n=Math.cos(t*U);return ui(yt*n)-9}function Ct(e){const t=Math.cos(e*U);return Q/yt/t}function $t(e){const{latitude:t,longitude:n,highPrecision:s=!1}=e;G(Number.isFinite(t)&&Number.isFinite(n));const r=Q,i=Math.cos(t*U),o=r/360,c=o/i,a=r/yt/i,l={unitsPerMeter:[a,a,a],metersPerUnit:[1/a,1/a,1/a],unitsPerDegree:[o,c,a],degreesPerUnit:[1/o,1/c,1/a]};if(s){const f=U*Math.tan(t*U)/i,h=o*f/2,u=r/yt*f,d=u/c*a;l.unitsPerDegree2=[0,h,u],l.unitsPerMeter2=[d,0,d]}return l}function pi(e,t){const[n,s,r]=e,[i,o,c]=t,{unitsPerMeter:a,unitsPerMeter2:l}=$t({longitude:n,latitude:s,highPrecision:!0}),f=Tt(e);f[0]+=i*(a[0]+l[0]*o),f[1]+=o*(a[1]+l[1]*o);const h=At(f),u=(r||0)+(c||0);return Number.isFinite(r)||Number.isFinite(c)?[h[0],h[1],u]:h}function mi(e){const{height:t,pitch:n,bearing:s,altitude:r,scale:i,center:o}=e,c=li();_t(c,c,[0,0,-r]),qe(c,c,-n*U),Ze(c,c,s*U);const a=i/t;return Xt(c,c,[a,a,a]),o&&_t(c,c,Ns([],o)),c}function gi(e){const{width:t,height:n,altitude:s,pitch:r=0,offset:i,center:o,scale:c,nearZMultiplier:a=1,farZMultiplier:l=1}=e;let{fovy:f=Mt(hi)}=e;s!==void 0&&(f=Mt(s));const h=f*U,u=r*U,d=fn(f);let m=d;o&&(m+=o[2]*c/Math.cos(u)/n);const p=h*(.5+(i?i[1]:0)/n),g=Math.sin(p)*m/Math.sin(kt(Math.PI/2-u-p,.01,Math.PI-.01)),E=Math.sin(u)*g+m,_=m*10,y=Math.min(E*l,_);return{fov:h,aspect:t/n,focalDistance:d,near:a,far:y}}function Mt(e){return 2*Math.atan(.5/e)*Gt}function fn(e){return .5/Math.tan(.5*e*U)}function _i(e,t){const[n,s,r=0]=e;return G(Number.isFinite(n)&&Number.isFinite(s)&&Number.isFinite(r)),q(t,[n,s,r,1])}function hn(e,t,n=0){const[s,r,i]=e;if(G(Number.isFinite(s)&&Number.isFinite(r),"invalid pixel coordinate"),Number.isFinite(i))return q(t,[s,r,i,1]);const o=q(t,[s,r,0,1]),c=q(t,[s,r,1,1]),a=o[2],l=c[2],f=a===l?0:((n||0)-a)/(l-a);return Ye([],o,c,f)}function Ei(e){const{width:t,height:n,bounds:s,minExtent:r=0,maxZoom:i=24,offset:o=[0,0]}=e,[[c,a],[l,f]]=s,h=yi(e.padding),u=Tt([c,kt(f,-at,at)]),d=Tt([l,kt(a,-at,at)]),m=[Math.max(Math.abs(d[0]-u[0]),r),Math.max(Math.abs(d[1]-u[1]),r)],p=[t-h.left-h.right-Math.abs(o[0])*2,n-h.top-h.bottom-Math.abs(o[1])*2];G(p[0]>0&&p[1]>0);const g=p[0]/m[0],E=p[1]/m[1],_=(h.right-h.left)/2/g,y=(h.top-h.bottom)/2/E,T=[(d[0]+u[0])/2+_,(d[1]+u[1])/2+y],v=At(T),M=Math.min(i,an(Math.abs(Math.min(g,E))));return G(Number.isFinite(M)),{longitude:v[0],latitude:v[1],zoom:M}}function yi(e=0){return typeof e=="number"?{top:e,bottom:e,left:e,right:e}:(G(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}const Te=Math.PI/180;function Ti(e,t=0){const{width:n,height:s,unproject:r}=e,i={targetZ:t},o=r([0,s],i),c=r([n,s],i);let a,l;const f=e.fovy?.5*e.fovy*Te:Math.atan(.5/e.altitude),h=(90-e.pitch)*Te;return f>h-.01?(a=Me(e,0,t),l=Me(e,n,t)):(a=r([0,0],i),l=r([n,0],i)),[o,c,l,a]}function Me(e,t,n){const{pixelUnprojectionMatrix:s}=e,r=q(s,[t,0,1,1]),i=q(s,[t,e.height,1,1]),c=(n*e.distanceScales.unitsPerMeter[2]-r[2])/(i[2]-r[2]),a=Ye([],r,i,c),l=At(a);return l.push(n),l}class Mi{constructor(t,n={id:"pass"}){const{id:s}=n;this.id=s,this.device=t,this.props={...n}}setProps(t){Object.assign(this.props,t)}render(t){}cleanup(){}}class Ki extends Mi{constructor(){super(...arguments),this._lastRenderIndex=-1}render(t){const[n,s]=this.device.canvasContext.getDrawingBufferSize(),r=t.clearCanvas??!0,i=t.clearColor??(r?[0,0,0,0]:!1),o=r?1:!1,c=r?0:!1,a=t.colorMask??15,l={viewport:[0,0,n,s]};t.colorMask&&(l.colorMask=a),t.scissorRect&&(l.scissorRect=t.scissorRect);const f=this.device.beginRenderPass({framebuffer:t.target,parameters:l,clearColor:i,clearDepth:o,clearStencil:c});try{return this._drawLayers(f,t)}finally{f.end(),this.device.submit()}}_drawLayers(t,n){const{target:s,shaderModuleProps:r,viewports:i,views:o,onViewportActive:c,clearStack:a=!0}=n;n.pass=n.pass||"unknown",a&&(this._lastRenderIndex=-1);const l=[];for(const f of i){const h=o&&o[f.id];c?.(f);const u=this._getDrawLayerParams(f,n),d=f.subViewports||[f];for(const m of d){const p=this._drawLayersInViewport(t,{target:s,shaderModuleProps:r,viewport:m,view:h,pass:n.pass,layers:n.layers},u);l.push(p)}}return l}_getDrawLayerParams(t,{layers:n,pass:s,isPicking:r=!1,layerFilter:i,cullRect:o,effects:c,shaderModuleProps:a},l=!1){const f=[],h=un(this._lastRenderIndex+1),u={layer:n[0],viewport:t,isPicking:r,renderPass:s,cullRect:o},d={};for(let m=0;m<n.length;m++){const p=n[m],g=this._shouldDrawLayer(p,u,i,d),E={shouldDrawLayer:g};g&&!l&&(E.shouldDrawLayer=!0,E.layerRenderIndex=h(p,g),E.shaderModuleProps=this._getShaderModuleProps(p,c,s,a),E.layerParameters={...p.context.deck?.props.parameters,...this.getLayerParameters(p,m,t)}),f[m]=E}return f}_drawLayersInViewport(t,{layers:n,shaderModuleProps:s,pass:r,target:i,viewport:o,view:c},a){const l=vi(this.device,{shaderModuleProps:s,target:i,viewport:o});if(c&&c.props.clear){const h=c.props.clear===!0?{color:!0,depth:!0}:c.props.clear;this.device.beginRenderPass({framebuffer:i,parameters:{viewport:l,scissorRect:l},clearColor:h.color?[0,0,0,0]:!1,clearDepth:h.depth?1:!1}).end()}const f={totalCount:n.length,visibleCount:0,compositeCount:0,pickableCount:0};t.setParameters({viewport:l});for(let h=0;h<n.length;h++){const u=n[h],d=a[h],{shouldDrawLayer:m}=d;if(m&&u.props.pickable&&f.pickableCount++,u.isComposite&&f.compositeCount++,u.isDrawable&&d.shouldDrawLayer){const{layerRenderIndex:p,shaderModuleProps:g,layerParameters:E}=d;f.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,p),g.project&&(g.project.viewport=o),u.context.renderPass=t;try{u._drawLayer({renderPass:t,shaderModuleProps:g,uniforms:{layerIndex:p},parameters:E})}catch(_){u.raiseError(_,`drawing ${u} to ${r}`)}}}return f}shouldDrawLayer(t){return!0}getShaderModuleProps(t,n,s){return null}getLayerParameters(t,n,s){return t.props.parameters}_shouldDrawLayer(t,n,s,r){if(!(t.props.visible&&this.shouldDrawLayer(t)))return!1;n.layer=t;let o=t.parent;for(;o;){if(!o.props.visible||!o.filterSubLayer(n))return!1;n.layer=o,o=o.parent}if(s){const c=n.layer.id;if(c in r||(r[c]=s(n)),!r[c])return!1}return t.activateViewport(n.viewport),!0}_getShaderModuleProps(t,n,s,r){const i=this.device.canvasContext.cssToDeviceRatio(),o=t.internalState?.propsInTransition||t.props,c={layer:o,picking:{isActive:!1},project:{viewport:t.context.viewport,devicePixelRatio:i,modelMatrix:o.modelMatrix,coordinateSystem:o.coordinateSystem,coordinateOrigin:o.coordinateOrigin,autoWrapLongitude:t.wrapLongitude}};if(n)for(const a of n)ve(c,a.getShaderModuleProps?.(t,c));return ve(c,this.getShaderModuleProps(t,n,c),r)}}function un(e=0,t={}){const n={},s=(r,i)=>{const o=r.props._offset,c=r.id,a=r.parent&&r.parent.id;let l;if(a&&!(a in t)&&s(r.parent,!1),a in n){const f=n[a]=n[a]||un(t[a],t);l=f(r,i),n[c]=f}else Number.isFinite(o)?(l=o+(t[a]||0),n[c]=null):l=e;return i&&l>=e&&(e=l+1),t[c]=l,l};return s}function vi(e,{shaderModuleProps:t,target:n,viewport:s}){const r=t?.project?.devicePixelRatio??e.canvasContext.cssToDeviceRatio(),[,i]=e.canvasContext.getDrawingBufferSize(),o=n?n.height:i,c=s;return[c.x*r,o-(c.y+c.height)*r,c.width*r,c.height*r]}function ve(e,...t){for(const n of t)if(n)for(const s in n)e[s]?Object.assign(e[s],n[s]):e[s]=n[s];return e}class Si{constructor(t={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(t)}setOptions(t){Object.assign(this.opts,t)}allocate(t,n,{size:s=1,type:r,padding:i=0,copy:o=!1,initialize:c=!1,maxCount:a}){const l=r||t&&t.constructor||Float32Array,f=n*s+i;if(ArrayBuffer.isView(t)){if(f<=t.length)return t;if(f*t.BYTES_PER_ELEMENT<=t.buffer.byteLength)return new l(t.buffer,0,f)}let h=1/0;a&&(h=a*s+i);const u=this._allocate(l,f,c,h);return t&&o?u.set(t):c||u.fill(0,0,4),this._release(t),u}release(t){this._release(t)}_allocate(t,n,s,r){let i=Math.max(Math.ceil(n*this.opts.overAlloc),1);i>r&&(i=r);const o=this._pool,c=t.BYTES_PER_ELEMENT*i,a=o.findIndex(l=>l.byteLength>=c);if(a>=0){const l=new t(o.splice(a,1)[0],0,i);return s&&l.fill(0),l}return new t(i)}_release(t){if(!ArrayBuffer.isView(t))return;const n=this._pool,{buffer:s}=t,{byteLength:r}=s,i=n.findIndex(o=>o.byteLength>=r);i<0?n.push(s):(i>0||n.length<this.opts.poolSize)&&n.splice(i,0,s),n.length>this.opts.poolSize&&n.shift()}}const Ai=new Si;function st(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Ji(e,t){const n=e%t;return n<0?t+n:n}function Li(e){return[e[12],e[13],e[14]]}function bi(e){return{left:X(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:X(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:X(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:X(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:X(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:X(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}const Se=new J;function X(e,t,n,s){Se.set(e,t,n);const r=Se.len();return{distance:s/r,normal:new J(-e/r,-t/r,-n/r)}}function Oi(e){return e-Math.fround(e)}let et;function Qi(e,t){const{size:n=1,startIndex:s=0}=t,r=t.endIndex!==void 0?t.endIndex:e.length,i=(r-s)/n;et=Ai.allocate(et,i,{type:Float32Array,size:n*2});let o=s,c=0;for(;o<r;){for(let a=0;a<n;a++){const l=e[o++];et[c+a]=l,et[c+a+n]=Oi(l)}c+=n*2}return et.subarray(0,i*n*2)}function to(e){let t=null,n=!1;for(const s of e)s&&(t?(n||(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],n=!0),t[0][0]=Math.min(t[0][0],s[0][0]),t[0][1]=Math.min(t[0][1],s[0][1]),t[1][0]=Math.max(t[1][0],s[1][0]),t[1][1]=Math.max(t[1][1],s[1][1])):t=s);return t}const Ri=Math.PI/180,xi=st(),Ae=[0,0,0],Pi={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function wi({width:e,height:t,orthographic:n,fovyRadians:s,focalDistance:r,padding:i,near:o,far:c}){const a=e/t,l=n?new B().orthographic({fovy:s,aspect:a,focalDistance:r,near:o,far:c}):new B().perspective({fovy:s,aspect:a,near:o,far:c});if(i){const{left:f=0,right:h=0,top:u=0,bottom:d=0}=i,m=mt((f+e-h)/2,0,e)-e/2,p=mt((u+t-d)/2,0,t)-t/2;l[8]-=m*2/e,l[9]+=p*2/t}return l}class Lt{constructor(t={}){this._frustumPlanes={},this.id=t.id||this.constructor.displayName||"viewport",this.x=t.x||0,this.y=t.y||0,this.width=t.width||1,this.height=t.height||1,this.zoom=t.zoom||0,this.padding=t.padding,this.distanceScales=t.distanceScales||Pi,this.focalDistance=t.focalDistance||1,this.position=t.position||Ae,this.modelMatrix=t.modelMatrix||null;const{longitude:n,latitude:s}=t;this.isGeospatial=Number.isFinite(s)&&Number.isFinite(n),this._initProps(t),this._initMatrices(t),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?z.WEB_MERCATOR:z.WEB_MERCATOR_AUTO_OFFSET:z.IDENTITY}equals(t){return t instanceof Lt?this===t?!0:t.width===this.width&&t.height===this.height&&t.scale===this.scale&&gt(t.projectionMatrix,this.projectionMatrix)&&gt(t.viewMatrix,this.viewMatrix):!1}project(t,{topLeft:n=!0}={}){const s=this.projectPosition(t),r=_i(s,this.pixelProjectionMatrix),[i,o]=r,c=n?o:this.height-o;return t.length===2?[i,c]:[i,c,r[2]]}unproject(t,{topLeft:n=!0,targetZ:s}={}){const[r,i,o]=t,c=n?i:this.height-i,a=s&&s*this.distanceScales.unitsPerMeter[2],l=hn([r,c,o],this.pixelUnprojectionMatrix,a),[f,h,u]=this.unprojectPosition(l);return Number.isFinite(o)?[f,h,u]:Number.isFinite(s)?[f,h,s]:[f,h]}projectPosition(t){const[n,s]=this.projectFlat(t),r=(t[2]||0)*this.distanceScales.unitsPerMeter[2];return[n,s,r]}unprojectPosition(t){const[n,s]=this.unprojectFlat(t),r=(t[2]||0)*this.distanceScales.metersPerUnit[2];return[n,s,r]}projectFlat(t){if(this.isGeospatial){const n=Tt(t);return n[1]=mt(n[1],-318,830),n}return t}unprojectFlat(t){return this.isGeospatial?At(t):t}getBounds(t={}){const n={targetZ:t.z||0},s=this.unproject([0,0],n),r=this.unproject([this.width,0],n),i=this.unproject([0,this.height],n),o=this.unproject([this.width,this.height],n);return[Math.min(s[0],r[0],i[0],o[0]),Math.min(s[1],r[1],i[1],o[1]),Math.max(s[0],r[0],i[0],o[0]),Math.max(s[1],r[1],i[1],o[1])]}getDistanceScales(t){return t&&this.isGeospatial?$t({longitude:t[0],latitude:t[1],highPrecision:!0}):this.distanceScales}containsPixel({x:t,y:n,width:s=1,height:r=1}){return t<this.x+this.width&&this.x<t+s&&n<this.y+this.height&&this.y<n+r}getFrustumPlanes(){return this._frustumPlanes.near?this._frustumPlanes:(Object.assign(this._frustumPlanes,bi(this.viewProjectionMatrix)),this._frustumPlanes)}panByPosition(t,n){return null}_initProps(t){const n=t.longitude,s=t.latitude;this.isGeospatial&&(Number.isFinite(t.zoom)||(this.zoom=di({latitude:s})+Math.log2(this.focalDistance)),this.distanceScales=t.distanceScales||$t({latitude:s,longitude:n}));const r=Math.pow(2,this.zoom);this.scale=r;const{position:i,modelMatrix:o}=t;let c=Ae;if(i&&(c=o?new B(o).transformAsVector(i,[]):i),this.isGeospatial){const a=this.projectPosition([n,s,0]);this.center=new J(c).scale(this.distanceScales.unitsPerMeter).add(a)}else this.center=this.projectPosition(c)}_initMatrices(t){const{viewMatrix:n=xi,projectionMatrix:s=null,orthographic:r=!1,fovyRadians:i,fovy:o=75,near:c=.1,far:a=1e3,padding:l=null,focalDistance:f=1}=t;this.viewMatrixUncentered=n,this.viewMatrix=new B().multiplyRight(n).translate(new J(this.center).negate()),this.projectionMatrix=s||wi({width:this.width,height:this.height,orthographic:r,fovyRadians:i||o*Ri,focalDistance:f,padding:l,near:c,far:a});const h=st();W(h,h,this.projectionMatrix),W(h,h,this.viewMatrix),this.viewProjectionMatrix=h,this.viewMatrixInverse=Ft([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=Li(this.viewMatrixInverse);const u=st(),d=st();Xt(u,u,[this.width/2,-this.height/2,1]),_t(u,u,[1,-1,0]),W(d,u,this.viewProjectionMatrix),this.pixelProjectionMatrix=d,this.pixelUnprojectionMatrix=Ft(st(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||Re.warn("Pixel project matrix not invertible")()}}Lt.displayName="Viewport";class vt extends Lt{constructor(t={}){const{latitude:n=0,longitude:s=0,zoom:r=0,pitch:i=0,bearing:o=0,nearZMultiplier:c=.1,farZMultiplier:a=1.01,nearZ:l,farZ:f,orthographic:h=!1,projectionMatrix:u,repeat:d=!1,worldOffset:m=0,position:p,padding:g,legacyMeterSizes:E=!1}=t;let{width:_,height:y,altitude:T=1.5}=t;const v=Math.pow(2,r);_=_||1,y=y||1;let M,A=null;if(u)T=u[5]/2,M=Mt(T);else{t.fovy?(M=t.fovy,T=fn(M)):M=Mt(T);let b;if(g){const{top:L=0,bottom:I=0}=g;b=[0,mt((L+y-I)/2,0,y)-y/2]}A=gi({width:_,height:y,scale:v,center:p&&[0,0,p[2]*Ct(n)],offset:b,pitch:i,fovy:M,nearZMultiplier:c,farZMultiplier:a}),Number.isFinite(l)&&(A.near=l),Number.isFinite(f)&&(A.far=f)}let R=mi({height:y,pitch:i,bearing:o,scale:v,altitude:T});m&&(R=new B().translate([512*m,0,0]).multiplyLeft(R)),super({...t,width:_,height:y,viewMatrix:R,longitude:s,latitude:n,zoom:r,...A,fovy:M,focalDistance:T}),this.latitude=n,this.longitude=s,this.zoom=r,this.pitch=i,this.bearing=o,this.altitude=T,this.fovy=M,this.orthographic=h,this._subViewports=d?[]:null,this._pseudoMeters=E,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){const t=this.getBounds(),n=Math.floor((t[0]+180)/360),s=Math.ceil((t[2]-180)/360);for(let r=n;r<=s;r++){const i=r?new vt({...this,worldOffset:r}):this;this._subViewports.push(i)}}return this._subViewports}projectPosition(t){if(this._pseudoMeters)return super.projectPosition(t);const[n,s]=this.projectFlat(t),r=(t[2]||0)*Ct(t[1]);return[n,s,r]}unprojectPosition(t){if(this._pseudoMeters)return super.unprojectPosition(t);const[n,s]=this.unprojectFlat(t),r=(t[2]||0)/Ct(s);return[n,s,r]}addMetersToLngLat(t,n){return pi(t,n)}panByPosition(t,n){const s=hn(n,this.pixelUnprojectionMatrix),r=this.projectFlat(t),i=le([],r,Ls([],s)),o=le([],this.center,i),[c,a]=this.unprojectFlat(o);return{longitude:c,latitude:a}}getBounds(t={}){const n=Ti(this,t.z||0);return[Math.min(n[0][0],n[1][0],n[2][0],n[3][0]),Math.min(n[0][1],n[1][1],n[2][1],n[3][1]),Math.max(n[0][0],n[1][0],n[2][0],n[3][0]),Math.max(n[0][1],n[1][1],n[2][1],n[3][1])]}fitBounds(t,n={}){const{width:s,height:r}=this,{longitude:i,latitude:o,zoom:c}=Ei({width:s,height:r,bounds:t,...n});return new vt({width:s,height:r,longitude:i,latitude:o,zoom:c})}}vt.displayName="WebMercatorViewport";function Ii(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ji(e){return Array.isArray(e)?e.length===0||typeof e[0]=="number":!1}function eo(e){return Ii(e)||ji(e)}function Le(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let s=0;s<e.length;s++)if(!Le(e[s],t[s],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e=="object"&&typeof t=="object"){const s=Object.keys(e),r=Object.keys(t);if(s.length!==r.length)return!1;for(const i of s)if(!t.hasOwnProperty(i)||!Le(e[i],t[i],n-1))return!1;return!0}return!1}export{$,fn as A,Mt as B,w as C,Gi as D,Hi as E,Fi as F,Ui as G,ki as H,Fr as I,St as J,sr as K,Ki as L,B as M,Ji as N,Tt as O,Vi as P,Ct as Q,S as R,nt as S,Er as T,pi as U,J as V,Yi as W,Xr as X,ft as Y,Qi as Z,to as _,yr as a,_i as a0,Et as a1,dn as a2,Ni as a3,Vt as a4,Zn as a5,Fe as a6,F as a7,Ci as a8,Ge as a9,Ut as aa,ze as ab,eo as ac,We as ad,Di as ae,le as af,Ls as ag,Oi as ah,ms as ai,Pe as aj,as as ak,zi as al,Tr as b,_r as c,Re as d,Wi as e,$i as f,an as g,Br as h,Wt as i,z as j,hn as k,Ht as l,Zi as m,mr as n,Lt as o,qi as p,Le as q,gt as r,Je as s,Es as t,mt as u,vt as v,At as w,Ai as x,Xi as y,at as z};
