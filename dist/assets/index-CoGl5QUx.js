import{o as ae,M as D,k as le,af as R,ag as ce,u as L,p as g,q as de,d as y,h as ue,C as v,ah as S,L as j,v as fe,r as me}from"./deep-equal-D6CKYaOP.js";import{L as _,M as pe,b as V}from"./collision-filter-extension-CBFjfxVe.js";import{C as jt,P as Vt}from"./collision-filter-extension-CBFjfxVe.js";import{P as he}from"./pick-layers-pass-BfkXGi0f.js";const ge=new D().lookAt({eye:[0,0,1]});function _e({width:n,height:e,near:t,far:i,padding:r}){let s=-n/2,o=n/2,a=-e/2,l=e/2;if(r){const{left:u=0,right:c=0,top:d=0,bottom:f=0}=r,m=L((u+n-c)/2,0,n)-n/2,p=L((d+e-f)/2,0,e)-e/2;s-=m,o-=m,a+=p,l+=p}return new D().ortho({left:s,right:o,bottom:a,top:l,near:t,far:i})}class ve extends ae{constructor(e){const{width:t,height:i,near:r=.1,far:s=1e3,zoom:o=0,target:a=[0,0,0],padding:l=null,flipY:u=!0}=e,c=Array.isArray(o)?o[0]:o,d=Array.isArray(o)?o[1]:o,f=Math.min(c,d),m=Math.pow(2,f);let p;if(c!==d){const b=Math.pow(2,c),x=Math.pow(2,d);p={unitsPerMeter:[b/m,x/m,1],metersPerUnit:[m/b,m/x,1]}}super({...e,longitude:void 0,position:a,viewMatrix:ge.clone().scale([m,m*(u?-1:1),m]),projectionMatrix:_e({width:t||1,height:i||1,padding:l,near:r,far:s}),zoom:f,distanceScales:p})}projectFlat([e,t]){const{unitsPerMeter:i}=this.distanceScales;return[e*i[0],t*i[1]]}unprojectFlat([e,t]){const{metersPerUnit:i}=this.distanceScales;return[e*i[0],t*i[1]]}panByPosition(e,t){const i=le(t,this.pixelUnprojectionMatrix),r=this.projectFlat(e),s=R([],r,ce([],i)),o=R([],this.center,s);return{target:this.unprojectFlat(o)}}}const z=`uniform brushingUniforms {
  bool enabled;
  highp int target;
  vec2 mousePos;
  float radius;
} brushing;
`,ye=`
  in vec2 brushingTargets;

  out float brushing_isVisible;

  bool brushing_isPointInRange(vec2 position) {
    if (!brushing.enabled) {
      return true;
    }
    vec2 source_commonspace = project_position(position);
    vec2 target_commonspace = project_position(brushing.mousePos);
    float distance = length((target_commonspace - source_commonspace) / project.commonUnitsPerMeter.xy);

    return distance <= brushing.radius;
  }

  bool brushing_arePointsInRange(vec2 sourcePos, vec2 targetPos) {
    return brushing_isPointInRange(sourcePos) || brushing_isPointInRange(targetPos);
  }

  void brushing_setVisible(bool visible) {
    brushing_isVisible = float(visible);
  }
`,be=`
${z}
${ye}
`,xe=`
  in float brushing_isVisible;
`,Pe=`
${z}
${xe}
`,Me={source:0,target:1,custom:2,source_target:3},Te={"vs:DECKGL_FILTER_GL_POSITION":`
    vec2 brushingTarget;
    vec2 brushingSource;
    if (brushing.target == 3) {
      brushingTarget = geometry.worldPositionAlt.xy;
      brushingSource = geometry.worldPosition.xy;
    } else if (brushing.target == 0) {
      brushingTarget = geometry.worldPosition.xy;
    } else if (brushing.target == 1) {
      brushingTarget = geometry.worldPositionAlt.xy;
    } else {
      brushingTarget = brushingTargets;
    }
    bool visible;
    if (brushing.target == 3) {
      visible = brushing_arePointsInRange(brushingSource, brushingTarget);
    } else {
      visible = brushing_isPointInRange(brushingTarget);
    }
    brushing_setVisible(visible);
  `,"fs:DECKGL_FILTER_COLOR":`
    if (brushing.enabled && brushing_isVisible < 0.5) {
      discard;
    }
  `},Ee={name:"brushing",dependencies:[g],vs:be,fs:Pe,inject:Te,getUniforms:n=>{if(!n||!("viewport"in n))return{};const{brushingEnabled:e=!0,brushingRadius:t=1e4,brushingTarget:i="source",mousePosition:r,viewport:s}=n;return{enabled:!!(e&&r&&s.containsPixel(r)),radius:t,target:Me[i]||0,mousePos:r?s.unproject([r.x-s.x,r.y-s.y]):[0,0]}},uniformTypes:{enabled:"i32",target:"i32",mousePos:"vec2<f32>",radius:"f32"}},Ce={getBrushingTarget:{type:"accessor",value:[0,0]},brushingTarget:"source",brushingEnabled:!0,brushingRadius:1e4};class N extends _{getShaders(){return{modules:[Ee]}}initializeState(e,t){const i=this.getAttributeManager();i&&i.add({brushingTargets:{size:2,stepMode:"dynamic",accessor:"getBrushingTarget"}});const r=()=>{this.getCurrentLayer()?.setNeedsRedraw()};this.state.onMouseMove=r,e.deck&&e.deck.eventManager.on({pointermove:r,pointerleave:r})}finalizeState(e,t){if(e.deck){const i=this.state.onMouseMove;e.deck.eventManager.off({pointermove:i,pointerleave:i})}}draw(e,t){const{viewport:i,mousePosition:r}=e.context,{brushingEnabled:s,brushingRadius:o,brushingTarget:a}=this.props,l={viewport:i,mousePosition:r,brushingEnabled:s,brushingRadius:o,brushingTarget:a};this.setShaderModuleProps({brushing:l})}}N.defaultProps=Ce;N.extensionName="BrushingExtension";const U=`uniform dataFilterUniforms {
  bool useSoftMargin;
  bool enabled;
  bool transformSize;
  bool transformColor;
#ifdef DATAFILTER_TYPE
  DATAFILTER_TYPE min;
  DATAFILTER_TYPE softMin;
  DATAFILTER_TYPE softMax;
  DATAFILTER_TYPE max;
#ifdef DATAFILTER_DOUBLE
  DATAFILTER_TYPE min64High;
  DATAFILTER_TYPE max64High;
#endif
#endif
#ifdef DATACATEGORY_TYPE
  highp uvec4 categoryBitMask;
#endif
} dataFilter;
`,Fe=`
#ifdef DATAFILTER_TYPE
  in DATAFILTER_TYPE filterValues;
#ifdef DATAFILTER_DOUBLE
  in DATAFILTER_TYPE filterValues64Low;
#endif
#endif

#ifdef DATACATEGORY_TYPE
  in DATACATEGORY_TYPE filterCategoryValues;
#endif

out float dataFilter_value;

float dataFilter_reduceValue(float value) {
  return value;
}
float dataFilter_reduceValue(vec2 value) {
  return min(value.x, value.y);
}
float dataFilter_reduceValue(vec3 value) {
  return min(min(value.x, value.y), value.z);
}
float dataFilter_reduceValue(vec4 value) {
  return min(min(value.x, value.y), min(value.z, value.w));
}

#ifdef DATAFILTER_TYPE
  void dataFilter_setValue(DATAFILTER_TYPE valueFromMin, DATAFILTER_TYPE valueFromMax) {
    if (dataFilter.useSoftMargin) {
      // smoothstep results are undefined if edge0 ≥ edge1
      // Fallback to ignore filterSoftRange if it is truncated by filterRange
      DATAFILTER_TYPE leftInRange = mix(
        smoothstep(dataFilter.min, dataFilter.softMin, valueFromMin),
        step(dataFilter.min, valueFromMin),
        step(dataFilter.softMin, dataFilter.min)
      );
      DATAFILTER_TYPE rightInRange = mix(
        1.0 - smoothstep(dataFilter.softMax, dataFilter.max, valueFromMax),
        step(valueFromMax, dataFilter.max),
        step(dataFilter.max, dataFilter.softMax)
      );
      dataFilter_value = dataFilter_reduceValue(leftInRange * rightInRange);
    } else {
      dataFilter_value = dataFilter_reduceValue(
        step(dataFilter.min, valueFromMin) * step(valueFromMax, dataFilter.max)
      );
    }
  }
#endif

#ifdef DATACATEGORY_TYPE
  void dataFilter_setCategoryValue(DATACATEGORY_TYPE category) {
    #if DATACATEGORY_CHANNELS == 1 // One 128-bit mask
    uint dataFilter_masks = dataFilter.categoryBitMask[category / 32u];
    #elif DATACATEGORY_CHANNELS == 2 // Two 64-bit masks
    uvec2 dataFilter_masks = uvec2(
      dataFilter.categoryBitMask[category.x / 32u],
      dataFilter.categoryBitMask[category.y / 32u + 2u]
    );
    #elif DATACATEGORY_CHANNELS == 3 // Three 32-bit masks
    uvec3 dataFilter_masks = dataFilter.categoryBitMask.xyz;
    #else // Four 32-bit masks
    uvec4 dataFilter_masks = dataFilter.categoryBitMask;
    #endif

    // Shift mask and extract relevant bits
    DATACATEGORY_TYPE dataFilter_bits = DATACATEGORY_TYPE(dataFilter_masks) >> (category & 31u);
    dataFilter_bits &= 1u;

    #if DATACATEGORY_CHANNELS == 1
    if(dataFilter_bits == 0u) dataFilter_value = 0.0;
    #else
    if(any(equal(dataFilter_bits, DATACATEGORY_TYPE(0u)))) dataFilter_value = 0.0;
    #endif
  }
#endif
`,G=`
${U}
${Fe}
`,ke=`
in float dataFilter_value;
`,H=`
${U}
${ke}
`;function Y(n){if(!n||!("extensions"in n))return{};const{filterRange:e=[-1,1],filterEnabled:t=!0,filterTransformSize:i=!0,filterTransformColor:r=!0,categoryBitMask:s}=n,o=n.filterSoftRange||e;return{...Number.isFinite(e[0])?{min:e[0],softMin:o[0],softMax:o[1],max:e[1]}:{min:e.map(a=>a[0]),softMin:o.map(a=>a[0]),softMax:o.map(a=>a[1]),max:e.map(a=>a[1])},enabled:t,useSoftMargin:!!n.filterSoftRange,transformSize:t&&i,transformColor:t&&r,...s&&{categoryBitMask:s}}}function Ae(n){if(!n||!("extensions"in n))return{};const e=Y(n);if(Number.isFinite(e.min)){const t=Math.fround(e.min);e.min-=t,e.softMin-=t,e.min64High=t;const i=Math.fround(e.max);e.max-=i,e.softMax-=i,e.max64High=i}else{const t=e.min.map(Math.fround);e.min=e.min.map((r,s)=>r-t[s]),e.softMin=e.softMin.map((r,s)=>r-t[s]),e.min64High=t;const i=e.max.map(Math.fround);e.max=e.max.map((r,s)=>r-i[s]),e.softMax=e.softMax.map((r,s)=>r-i[s]),e.max64High=i}return e}const $={"vs:#main-start":`
    dataFilter_value = 1.0;
    if (dataFilter.enabled) {
      #ifdef DATAFILTER_TYPE
        #ifdef DATAFILTER_DOUBLE
          dataFilter_setValue(
            filterValues - dataFilter.min64High + filterValues64Low,
            filterValues - dataFilter.max64High + filterValues64Low
          );
        #else
          dataFilter_setValue(filterValues, filterValues);
        #endif
      #endif

      #ifdef DATACATEGORY_TYPE
        dataFilter_setCategoryValue(filterCategoryValues);
      #endif
    }
  `,"vs:#main-end":`
    if (dataFilter_value == 0.0) {
      gl_Position = vec4(0.);
    }
  `,"vs:DECKGL_FILTER_SIZE":`
    if (dataFilter.transformSize) {
      size = size * dataFilter_value;
    }
  `,"fs:DECKGL_FILTER_COLOR":`
    if (dataFilter_value == 0.0) discard;
    if (dataFilter.transformColor) {
      color.a *= dataFilter_value;
    }
  `};function K(n){const{categorySize:e,filterSize:t,fp64:i}=n,r={useSoftMargin:"i32",enabled:"i32",transformSize:"i32",transformColor:"i32"};if(t){const s=t===1?"f32":`vec${t}<f32>`;r.min=s,r.softMin=s,r.softMax=s,r.max=s,i&&(r.min64High=s,r.max64High=s)}return e&&(r.categoryBitMask="vec4<i32>"),r}const we={name:"dataFilter",vs:G,fs:H,inject:$,getUniforms:Y,uniformTypesFromOptions:K},Re={name:"dataFilter",vs:G,fs:H,inject:$,getUniforms:Ae,uniformTypesFromOptions:K},Le=`#version 300 es
#define SHADER_NAME data-filter-vertex-shader

#ifdef FLOAT_TARGET
  in float filterIndices;
  in float filterPrevIndices;
#else
  in vec2 filterIndices;
  in vec2 filterPrevIndices;
#endif

out vec4 vColor;
const float component = 1.0 / 255.0;

void main() {
  #ifdef FLOAT_TARGET
    dataFilter_value *= float(filterIndices != filterPrevIndices);
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    vColor = vec4(0.0, 0.0, 0.0, 1.0);
  #else
    // Float texture is not supported: pack result into 4 channels x 256 px x 64px
    dataFilter_value *= float(filterIndices.x != filterPrevIndices.x);
    float col = filterIndices.x;
    float row = filterIndices.y * 4.0;
    float channel = floor(row);
    row = fract(row);
    vColor = component * vec4(bvec4(channel == 0.0, channel == 1.0, channel == 2.0, channel == 3.0));
    gl_Position = vec4(col * 2.0 - 1.0, row * 2.0 - 1.0, 0.0, 1.0);
  #endif
  gl_PointSize = 1.0;
}
`,Se=`#version 300 es
#define SHADER_NAME data-filter-fragment-shader
precision highp float;

in vec4 vColor;

out vec4 fragColor;

void main() {
  if (dataFilter_value < 0.5) {
    discard;
  }
  fragColor = vColor;
}
`,Ie=["float32-renderable-webgl","texture-blend-float-webgl"];function Oe(n){return Ie.every(e=>n.features.has(e))}function Be(n,e){return e?n.createFramebuffer({width:1,height:1,colorAttachments:[n.createTexture({format:"rgba32float",mipmaps:!1})]}):n.createFramebuffer({width:256,height:64,colorAttachments:[n.createTexture({format:"rgba8unorm",mipmaps:!1})]})}function De(n,e,t,i){return t.defines.NON_INSTANCED_MODEL=1,i&&(t.defines.FLOAT_TARGET=1),new pe(n,{id:"data-filter-aggregation-model",vertexCount:1,isInstanced:!1,topology:"point-list",disableWarnings:!0,vs:Le,fs:Se,bufferLayout:e,...t})}const je={blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendColorOperation:"add",blendAlphaOperation:"add",depthCompare:"never"},Ve={getFilterValue:{type:"accessor",value:0},getFilterCategory:{type:"accessor",value:0},onFilteredItemsChange:{type:"function",value:null,optional:!0},filterEnabled:!0,filterRange:[-1,1],filterSoftRange:null,filterCategories:[0],filterTransformSize:!0,filterTransformColor:!0},ze={categorySize:0,filterSize:1,fp64:!1,countItems:!1},Ne={1:"uint",2:"uvec2",3:"uvec3",4:"uvec4"},Ue={1:"float",2:"vec2",3:"vec3",4:"vec4"};class W extends _{constructor(e={}){super({...ze,...e})}getShaders(e){const{categorySize:t,filterSize:i,fp64:r}=e.opts,s={};t&&(s.DATACATEGORY_TYPE=Ne[t],s.DATACATEGORY_CHANNELS=t),i&&(s.DATAFILTER_TYPE=Ue[i],s.DATAFILTER_DOUBLE=!!r);const o=r?Re:we;return o.uniformTypes=o.uniformTypesFromOptions(e.opts),{modules:[o],defines:s}}initializeState(e,t){const i=this.getAttributeManager(),{categorySize:r,filterSize:s,fp64:o}=t.opts;i&&(s&&i.add({filterValues:{size:s,type:o?"float64":"float32",stepMode:"dynamic",accessor:"getFilterValue"}}),r&&i.add({filterCategoryValues:{size:r,stepMode:"dynamic",accessor:"getFilterCategory",type:"uint32",transform:r===1?l=>t._getCategoryKey.call(this,l,0):l=>l.map((u,c)=>t._getCategoryKey.call(this,u,c))}}));const{device:a}=this.context;if(i&&t.opts.countItems){const l=Oe(a);i.add({filterVertexIndices:{size:l?1:2,vertexOffset:1,type:"unorm8",accessor:(d,{index:f})=>{const m=d&&d.__source?d.__source.index:f;return l?(m+1)%255:[(m+1)%255,Math.floor(m/255)%255]},shaderAttributes:{filterPrevIndices:{vertexOffset:0},filterIndices:{vertexOffset:1}}}});const u=Be(a,l),c=De(a,i.getBufferLayouts({isInstanced:!1}),t.getShaders.call(this,t),l);this.setState({filterFBO:u,filterModel:c})}}updateState({props:e,oldProps:t,changeFlags:i},r){const s=this.getAttributeManager(),{categorySize:o}=r.opts;if(this.state.filterModel){const a=s.attributes.filterValues?.needsUpdate()||s.attributes.filterCategoryValues?.needsUpdate()||e.filterEnabled!==t.filterEnabled||e.filterRange!==t.filterRange||e.filterSoftRange!==t.filterSoftRange||e.filterCategories!==t.filterCategories;a&&this.setState({filterNeedsUpdate:a})}s?.attributes.filterCategoryValues&&((s.attributes.filterCategoryValues.needsUpdate()||!de(e.filterCategories,t.filterCategories,2))&&this.setState({categoryBitMask:null}),i.dataChanged&&(this.setState({categoryMap:Array(o).fill(0).map(()=>({}))}),s.attributes.filterCategoryValues.setNeedsUpdate("categoryMap")))}draw(e,t){const i=this.state.filterFBO,r=this.state.filterModel,s=this.state.filterNeedsUpdate;this.state.categoryBitMask||t._updateCategoryBitMask.call(this,e,t);const{onFilteredItemsChange:o,extensions:a,filterEnabled:l,filterRange:u,filterSoftRange:c,filterTransformSize:d,filterTransformColor:f,filterCategories:m}=this.props,p={extensions:a,filterEnabled:l,filterRange:u,filterSoftRange:c,filterTransformSize:d,filterTransformColor:f,filterCategories:m};if(this.state.categoryBitMask&&(p.categoryBitMask=this.state.categoryBitMask),this.setShaderModuleProps({dataFilter:p}),s&&o&&r){const b=this.getAttributeManager(),{attributes:{filterValues:x,filterCategoryValues:re,filterVertexIndices:se}}=b;r.setVertexCount(this.getNumInstances());const oe={...x?.getValue(),...re?.getValue(),...se?.getValue()};r.setAttributes(oe),r.shaderInputs.setProps({dataFilter:p});const ne=[0,0,i.width,i.height],k=r.device.beginRenderPass({id:"data-filter-aggregation",framebuffer:i,parameters:{viewport:ne},clearColor:[0,0,0,0]});r.setParameters(je),r.draw(k),k.end();const A=r.device.readPixelsToArrayWebGL(i);let w=0;for(let P=0;P<A.length;P++)w+=A[P];o({id:this.id,count:w}),this.state.filterNeedsUpdate=!1}}finalizeState(){const e=this.state.filterFBO,t=this.state.filterModel;e?.destroy(),t?.destroy()}_updateCategoryBitMask(e,t){const{categorySize:i}=t.opts;if(!i)return;const{filterCategories:r}=this.props,s=new Uint32Array([0,0,0,0]),o=i===1?[r]:r,a=i===1?128:i===2?64:32;for(let l=0;l<o.length;l++){const u=o[l];for(const c of u){const d=t._getCategoryKey.call(this,c,l);if(d<a){const f=l*(a/32)+Math.floor(d/32);s[f]+=Math.pow(2,d%32)}else y.warn(`Exceeded maximum number of categories (${a})`)()}}this.state.categoryBitMask=s}_getCategoryKey(e,t){const i=this.state.categoryMap[t];return e in i||(i[e]=Object.keys(i).length),i[e]}}W.defaultProps=Ve;W.extensionName="DataFilterExtension";const Ge=`const vec2 WORLD_SCALE_FP64 = vec2(81.4873275756836, 0.0000032873668232014097);
uniform project64Uniforms {
vec2 scale;
mat4 viewProjectionMatrix;
mat4 viewProjectionMatrix64Low;
} project64;
void mercatorProject_fp64(vec4 lnglat_fp64, out vec2 out_val[2]) {
#if defined(NVIDIA_FP64_WORKAROUND)
out_val[0] = sum_fp64(radians_fp64(lnglat_fp64.xy), PI_FP64 * ONE);
#else
out_val[0] = sum_fp64(radians_fp64(lnglat_fp64.xy), PI_FP64);
#endif
out_val[1] = sum_fp64(PI_FP64,
log_fp64(tan_fp64(sum_fp64(PI_4_FP64, radians_fp64(lnglat_fp64.zw) / 2.0))));
return;
}
void project_position_fp64(vec4 position_fp64, out vec2 out_val[2]) {
vec2 pos_fp64[2];
mercatorProject_fp64(position_fp64, pos_fp64);
out_val[0] = mul_fp64(pos_fp64[0], WORLD_SCALE_FP64);
out_val[1] = mul_fp64(pos_fp64[1], WORLD_SCALE_FP64);
return;
}
void project_position_fp64(vec2 position, vec2 position64xyLow, out vec2 out_val[2]) {
vec4 position64xy = vec4(
position.x, position64xyLow.x,
position.y, position64xyLow.y);
project_position_fp64(position64xy, out_val);
}
vec4 project_common_position_to_clipspace_fp64(vec2 vertex_pos_modelspace[4]) {
vec2 vertex_pos_clipspace[4];
vec2 viewProjectionMatrixFP64[16];
for (int i = 0; i < 4; i++) {
for (int j = 0; j < 4; j++) {
viewProjectionMatrixFP64[4 * i + j] = vec2(
project64.viewProjectionMatrix[j][i],
project64.viewProjectionMatrix64Low[j][i]
);
}
}
mat4_vec4_mul_fp64(viewProjectionMatrixFP64, vertex_pos_modelspace,
vertex_pos_clipspace);
return vec4(
vertex_pos_clipspace[0].x,
vertex_pos_clipspace[1].x,
vertex_pos_clipspace[2].x,
vertex_pos_clipspace[3].x
);
}
vec4 project_position_to_clipspace(
vec3 position, vec3 position64xyLow, vec3 offset, out vec4 commonPosition
) {
vec2 offset64[4];
vec4_fp64(vec4(offset, 0.0), offset64);
float z = project_size(position.z);
vec2 projectedPosition64xy[2];
project_position_fp64(position.xy, position64xyLow.xy, projectedPosition64xy);
vec2 commonPosition64[4];
commonPosition64[0] = sum_fp64(offset64[0], projectedPosition64xy[0]);
commonPosition64[1] = sum_fp64(offset64[1], projectedPosition64xy[1]);
commonPosition64[2] = sum_fp64(offset64[2], vec2(z, 0.0));
commonPosition64[3] = vec2(1.0, 0.0);
commonPosition = vec4(projectedPosition64xy[0].x, projectedPosition64xy[1].x, z, 1.0);
return project_common_position_to_clipspace_fp64(commonPosition64);
}
vec4 project_position_to_clipspace(
vec3 position, vec3 position64xyLow, vec3 offset
) {
vec4 commonPosition;
return project_position_to_clipspace(
position, position64xyLow, offset, commonPosition
);
}
`,{fp64ify:He,fp64ifyMatrix4:Ye}=V,$e={name:"project64",dependencies:[g,V],vs:Ge,getUniforms:We,uniformTypes:{scale:"vec2<f32>",viewProjectionMatrix:"mat4x4<f32>",viewProjectionMatrix64Low:"mat4x4<f32>"}},Ke=ue(Ze);function We(n){if(n&&"viewport"in n){const{viewProjectionMatrix:e,scale:t}=n.viewport;return Ke({viewProjectionMatrix:e,scale:t})}return{}}function Ze({viewProjectionMatrix:n,scale:e}){const t=Ye(n),i=new Float32Array(16),r=new Float32Array(16);for(let s=0;s<4;s++)for(let o=0;o<4;o++){const a=4*s+o,l=4*o+s;i[l]=t[2*a],r[l]=t[2*a+1]}return{scale:He(e),viewProjectionMatrix:[...i],viewProjectionMatrix64Low:[...r]}}class qe extends _{getShaders(){const{coordinateSystem:e}=this.props;if(e!==v.LNGLAT&&e!==v.DEFAULT)throw new Error("fp64: coordinateSystem must be LNGLAT");return{modules:[$e]}}draw(e,t){const{viewport:i}=e.context;this.setShaderModuleProps({project64:{viewport:i}})}}qe.extensionName="Fp64Extension";const Z=`uniform fillUniforms {
  vec2 patternTextureSize;
  bool patternEnabled;
  bool patternMask;
  vec2 uvCoordinateOrigin;
  vec2 uvCoordinateOrigin64Low;
} fill;
`,Xe=`
in vec4 fillPatternFrames;
in float fillPatternScales;
in vec2 fillPatternOffsets;

out vec2 fill_uv;
out vec4 fill_patternBounds;
out vec4 fill_patternPlacement;
`,Je=`
${Z}
${Xe}
`,Qe=`
uniform sampler2D fill_patternTexture;

in vec4 fill_patternBounds;
in vec4 fill_patternPlacement;
in vec2 fill_uv;

const float FILL_UV_SCALE = 512.0 / 40000000.0;
`,et=`
${Z}
${Qe}
`,tt={"vs:DECKGL_FILTER_GL_POSITION":`
    fill_uv = geometry.position.xy;
  `,"vs:DECKGL_FILTER_COLOR":`
    if (fill.patternEnabled) {
      fill_patternBounds = fillPatternFrames / vec4(fill.patternTextureSize, fill.patternTextureSize);
      fill_patternPlacement.xy = fillPatternOffsets;
      fill_patternPlacement.zw = fillPatternScales * fillPatternFrames.zw;
    }
  `,"fs:DECKGL_FILTER_COLOR":`
    if (fill.patternEnabled) {
      vec2 scale = FILL_UV_SCALE * fill_patternPlacement.zw;
      vec2 patternUV = mod(mod(fill.uvCoordinateOrigin, scale) + fill.uvCoordinateOrigin64Low + fill_uv, scale) / scale;
      patternUV = mod(fill_patternPlacement.xy + patternUV, 1.0);

      vec2 texCoords = fill_patternBounds.xy + fill_patternBounds.zw * patternUV;

      vec4 patternColor = texture(fill_patternTexture, texCoords);
      color.a *= patternColor.a;
      if (!fill.patternMask) {
        color.rgb = patternColor.rgb;
      }
    }
  `};function it(n){if(!n)return{};const e={};if("fillPatternTexture"in n){const{fillPatternTexture:t}=n;e.fill_patternTexture=t,e.patternTextureSize=[t.width,t.height]}if("project"in n){const{fillPatternMask:t=!0,fillPatternEnabled:i=!0}=n,r=g.getUniforms(n.project),{commonOrigin:s}=r,o=[S(s[0]),S(s[1])];e.uvCoordinateOrigin=s.slice(0,2),e.uvCoordinateOrigin64Low=o,e.patternMask=t,e.patternEnabled=i}return e}const rt={name:"fill",vs:Je,fs:et,inject:tt,dependencies:[g],getUniforms:it,uniformTypes:{patternTextureSize:"vec2<f32>",patternEnabled:"i32",patternMask:"i32",uvCoordinateOrigin:"vec2<f32>",uvCoordinateOrigin64Low:"vec2<f32>"}},st={fillPatternEnabled:!0,fillPatternAtlas:{type:"image",value:null,async:!0,parameters:{lodMaxClamp:0}},fillPatternMapping:{type:"object",value:{},async:!0},fillPatternMask:!0,getFillPattern:{type:"accessor",value:n=>n.pattern},getFillPatternScale:{type:"accessor",value:1},getFillPatternOffset:{type:"accessor",value:[0,0]}};class q extends _{constructor({pattern:e=!1}={}){super({pattern:e})}isEnabled(e){return e.getAttributeManager()!==null&&!("pathTesselator"in e.state)}getShaders(e){return e.isEnabled(this)?{modules:[e.opts.pattern&&rt].filter(Boolean)}:null}initializeState(e,t){if(!t.isEnabled(this))return;const i=this.getAttributeManager();t.opts.pattern&&i.add({fillPatternFrames:{size:4,stepMode:"dynamic",accessor:"getFillPattern",transform:t.getPatternFrame.bind(this)},fillPatternScales:{size:1,stepMode:"dynamic",accessor:"getFillPatternScale",defaultValue:1},fillPatternOffsets:{size:2,stepMode:"dynamic",accessor:"getFillPatternOffset"}}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState({props:e,oldProps:t},i){i.isEnabled(this)&&e.fillPatternMapping&&e.fillPatternMapping!==t.fillPatternMapping&&this.getAttributeManager().invalidate("getFillPattern")}draw(e,t){if(!t.isEnabled(this))return;const{fillPatternAtlas:i,fillPatternEnabled:r,fillPatternMask:s}=this.props,o={project:e.shaderModuleProps.project,fillPatternEnabled:r,fillPatternMask:s,fillPatternTexture:i||this.state.emptyTexture};this.setShaderModuleProps({fill:o})}finalizeState(){this.state.emptyTexture?.delete()}getPatternFrame(e){const{fillPatternMapping:t}=this.getCurrentLayer().props,i=t&&t[e];return i?[i.x,i.y,i.width,i.height]:[0,0,0,0]}}q.defaultProps=st;q.extensionName="FillStyleExtension";const ot={clipBounds:[0,0,1,1],clipByInstance:void 0},X=`
uniform clipUniforms {
  vec4 bounds;
} clip;

bool clip_isInBounds(vec2 position) {
  return position.x >= clip.bounds[0] && position.y >= clip.bounds[1] && position.x < clip.bounds[2] && position.y < clip.bounds[3];
}
`,nt={name:"clip",vs:X,uniformTypes:{bounds:"vec4<f32>"}},at={"vs:#decl":`
out float clip_isVisible;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_isVisible = float(clip_isInBounds(geometry.worldPosition.xy));
`,"fs:#decl":`
in float clip_isVisible;
`,"fs:DECKGL_FILTER_COLOR":`
  if (clip_isVisible < 0.5) discard;
`},lt={name:"clip",fs:X,uniformTypes:{bounds:"vec4<f32>"}},ct={"vs:#decl":`
out vec2 clip_commonPosition;
`,"vs:DECKGL_FILTER_GL_POSITION":`
  clip_commonPosition = geometry.position.xy;
`,"fs:#decl":`
in vec2 clip_commonPosition;
`,"fs:DECKGL_FILTER_COLOR":`
  if (!clip_isInBounds(clip_commonPosition)) discard;
`};class J extends _{getShaders(){let e="instancePositions"in this.getAttributeManager().attributes;return this.props.clipByInstance!==void 0&&(e=!!this.props.clipByInstance),this.state.clipByInstance=e,e?{modules:[nt],inject:at}:{modules:[lt],inject:ct}}draw(){const{clipBounds:e}=this.props,t={};if(this.state.clipByInstance)t.bounds=e;else{const i=this.projectPosition([e[0],e[1],0]),r=this.projectPosition([e[2],e[3],0]);t.bounds=[Math.min(i[0],r[0]),Math.min(i[1],r[1]),Math.max(i[0],r[0]),Math.max(i[1],r[1])]}this.setShaderModuleProps({clip:t})}}J.defaultProps=ot;J.extensionName="ClipExtension";const Q=`uniform maskUniforms {
  vec4 bounds;
  highp int channel;
  bool enabled;
  bool inverted;
  bool maskByInstance;
} mask;
`,dt=`
vec2 mask_getCoords(vec4 position) {
  return (position.xy - mask.bounds.xy) / (mask.bounds.zw - mask.bounds.xy);
}
`,ut=`
${Q}
${dt}
`,ft=`
uniform sampler2D mask_texture;

bool mask_isInBounds(vec2 texCoords) {
  if (!mask.enabled) {
    return true;
  }
  vec4 maskColor = texture(mask_texture, texCoords);
  float maskValue = 1.0;
  if (mask.channel == 0) {
    maskValue = maskColor.r;
  } else if (mask.channel == 1) {
    maskValue = maskColor.g;
  } else if (mask.channel == 2) {
    maskValue = maskColor.b;
  } else if (mask.channel == 3) {
    maskValue = maskColor.a;
  }

  if (mask.inverted) {
    return maskValue >= 0.5;
  } else {
    return maskValue < 0.5;
  }
}
`,mt=`
${Q}
${ft}
`,pt={"vs:#decl":`
out vec2 mask_texCoords;
`,"vs:#main-end":`
   vec4 mask_common_position;
   if (mask.maskByInstance) {
     mask_common_position = project_position(vec4(geometry.worldPosition, 1.0));
   } else {
     mask_common_position = geometry.position;
   }
   mask_texCoords = mask_getCoords(mask_common_position);
`,"fs:#decl":`
in vec2 mask_texCoords;
`,"fs:#main-start":`
  if (mask.enabled) {
    bool mask = mask_isInBounds(mask_texCoords);

    // Debug: show extent of render target
    // fragColor = vec4(mask_texCoords, 0.0, 1.0);
    // fragColor = texture(mask_texture, mask_texCoords);

    if (!mask) discard;
  }
`},ht=n=>n&&"maskMap"in n?{mask_texture:n.maskMap}:n||{},gt={name:"mask",dependencies:[g],vs:ut,fs:mt,inject:pt,getUniforms:ht,uniformTypes:{bounds:"vec4<f32>",channel:"i32",enabled:"i32",inverted:"i32",maskByInstance:"i32"}},_t={blendColorOperation:"subtract",blendColorSrcFactor:"zero",blendColorDstFactor:"one",blendAlphaOperation:"subtract",blendAlphaSrcFactor:"zero",blendAlphaDstFactor:"one"};class vt extends j{constructor(e,t){super(e,t);const{mapSize:i=2048}=t;this.maskMap=e.createTexture({format:"rgba8unorm",width:i,height:i,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),this.fbo=e.createFramebuffer({id:"maskmap",width:i,height:i,colorAttachments:[this.maskMap]})}render(e){const t=2**e.channel,i=[255,255,255,255];super.render({...e,clearColor:i,colorMask:t,target:this.fbo,pass:"mask"})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!0,depthCompare:"always",..._t}}shouldDrawLayer(e){return e.props.operation.includes("mask")}delete(){this.fbo.delete(),this.maskMap.delete()}}function E(n,e){const t=[1/0,1/0,-1/0,-1/0];for(const i of n){const r=i.getBounds();if(r){const s=i.projectPosition(r[0],{viewport:e,autoOffset:!1}),o=i.projectPosition(r[1],{viewport:e,autoOffset:!1});t[0]=Math.min(t[0],s[0]),t[1]=Math.min(t[1],s[1]),t[2]=Math.max(t[2],o[0]),t[3]=Math.max(t[3],o[1])}}return Number.isFinite(t[0])?t:null}const yt=2048;function C(n){const{bounds:e,viewport:t,border:i=0}=n,{isGeospatial:r}=t;if(e[2]<=e[0]||e[3]<=e[1])return null;const s=t.unprojectPosition([(e[0]+e[2])/2,(e[1]+e[3])/2,0]);let{width:o,height:a,zoom:l}=n;if(l===void 0){o=o-i*2,a=a-i*2;const u=Math.min(o/(e[2]-e[0]),a/(e[3]-e[1]));l=Math.min(Math.log2(u),20)}else if(!o||!a){const u=2**l;o=Math.round(Math.abs(e[2]-e[0])*u),a=Math.round(Math.abs(e[3]-e[1])*u);const c=yt-i*2;if(o>c||a>c){const d=c/Math.max(o,a);o=Math.round(o*d),a=Math.round(a*d),l+=Math.log2(d)}}return r?new fe({id:t.id,x:i,y:i,width:o,height:a,longitude:s[0],latitude:s[1],zoom:l,orthographic:!0}):new ve({id:t.id,x:i,y:i,width:o,height:a,target:s,zoom:l,flipY:!1})}function bt(n,e){let t;t=n.getBounds();const i=n.projectPosition(t.slice(0,2)),r=n.projectPosition(t.slice(2,4));return[i[0],i[1],r[0],r[1]]}function F(n,e,t){if(!n)return[0,0,1,1];const i=bt(e),r=xt(i);return n[2]-n[0]<=r[2]-r[0]&&n[3]-n[1]<=r[3]-r[1]?n:[Math.max(n[0],r[0]),Math.max(n[1],r[1]),Math.min(n[2],r[2]),Math.min(n[3],r[3])]}function xt(n){const e=n[2]-n[0],t=n[3]-n[1],i=(n[0]+n[2])/2,r=(n[1]+n[3])/2;return[i-e,r-t,i+e,r+t]}class Pt{constructor(){this.id="mask-effect",this.props=null,this.useInPicking=!0,this.order=0,this.channels=[],this.masks=null}setup({device:e}){this.dummyMaskMap=e.createTexture({width:1,height:1}),this.maskPass=new vt(e,{id:"default-mask"}),this.maskMap=this.maskPass.maskMap}preRender({layers:e,layerFilter:t,viewports:i,onViewportActive:r,views:s,isPicking:o}){let a=!1;if(o)return{didRender:a};const l=e.filter(f=>f.props.visible&&f.props.operation.includes("mask"));if(l.length===0)return this.masks=null,this.channels.length=0,{didRender:a};this.masks={};const u=this._sortMaskChannels(l),c=i[0],d=!this.lastViewport||!this.lastViewport.equals(c);if(c.resolution!==void 0)return y.warn("MaskExtension is not supported in GlobeView")(),{didRender:a};for(const f in u){const m=this._renderChannel(u[f],{layerFilter:t,onViewportActive:r,views:s,viewport:c,viewportChanged:d});a||(a=m)}return{didRender:a}}_renderChannel(e,{layerFilter:t,onViewportActive:i,views:r,viewport:s,viewportChanged:o}){let a=!1;const l=this.channels[e.index];if(!l)return a;const u=e===l||e.layers.length!==l.layers.length||e.layers.some((c,d)=>c!==l.layers[d]||c.props.transitions)||e.layerBounds.some((c,d)=>c!==l.layerBounds[d]);if(e.bounds=l.bounds,e.maskBounds=l.maskBounds,this.channels[e.index]=e,u||o){this.lastViewport=s;const c=E(e.layers,s);if(e.bounds=c&&F(c,s),u||!me(e.bounds,l.bounds)){const{maskPass:d,maskMap:f}=this,m=c&&C({bounds:e.bounds,viewport:s,width:f.width,height:f.height,border:1});e.maskBounds=m?m.getBounds():[0,0,1,1],d.render({pass:"mask",channel:e.index,layers:e.layers,layerFilter:t,viewports:m?[m]:[],onViewportActive:i,views:r,shaderModuleProps:{project:{devicePixelRatio:1}}}),a=!0}}return this.masks[e.id]={index:e.index,bounds:e.maskBounds,coordinateOrigin:e.coordinateOrigin,coordinateSystem:e.coordinateSystem},a}_sortMaskChannels(e){const t={};let i=0;for(const r of e){const{id:s}=r.root;let o=t[s];if(!o){if(++i>4){y.warn("Too many mask layers. The max supported is 4")();continue}o={id:s,index:this.channels.findIndex(a=>a?.id===s),layers:[],layerBounds:[],coordinateOrigin:r.root.props.coordinateOrigin,coordinateSystem:r.root.props.coordinateSystem},t[s]=o}o.layers.push(r),o.layerBounds.push(r.getBounds())}for(let r=0;r<4;r++){const s=this.channels[r];(!s||!(s.id in t))&&(this.channels[r]=null)}for(const r in t){const s=t[r];s.index<0&&(s.index=this.channels.findIndex(o=>!o),this.channels[s.index]=s)}return t}getShaderModuleProps(){return{mask:{maskMap:this.masks?this.maskMap:this.dummyMaskMap,maskChannels:this.masks}}}cleanup(){this.dummyMaskMap&&(this.dummyMaskMap.delete(),this.dummyMaskMap=void 0),this.maskPass&&(this.maskPass.delete(),this.maskPass=void 0,this.maskMap=void 0),this.lastViewport=void 0,this.masks=null,this.channels.length=0}}const Mt={maskId:"",maskByInstance:void 0,maskInverted:!1};class ee extends _{initializeState(){this.context.deck?._addDefaultEffect(new Pt)}getShaders(){let e="instancePositions"in this.getAttributeManager().attributes;return this.props.maskByInstance!==void 0&&(e=!!this.props.maskByInstance),this.state.maskByInstance=e,{modules:[gt]}}draw({context:e,shaderModuleProps:t}){const i={};i.maskByInstance=!!this.state.maskByInstance;const{maskId:r,maskInverted:s}=this.props,{maskChannels:o}=t.mask||{},{viewport:a}=e;if(o&&o[r]){const{index:l,bounds:u,coordinateOrigin:c}=o[r];let{coordinateSystem:d}=o[r];i.enabled=!0,i.channel=l,i.inverted=s,d===v.DEFAULT&&(d=a.isGeospatial?v.LNGLAT:v.CARTESIAN);const f={modelMatrix:null,fromCoordinateOrigin:c,fromCoordinateSystem:d},m=this.projectPosition([u[0],u[1],0],f),p=this.projectPosition([u[2],u[3],0],f);i.bounds=[m[0],m[1],p[0],p[1]]}else r&&y.warn(`Could not find a mask layer with id: ${r}`)(),i.enabled=!1;this.setShaderModuleProps({mask:i})}}ee.defaultProps=Mt;ee.extensionName="MaskExtension";const h={NONE:0,WRITE_HEIGHT_MAP:1,USE_HEIGHT_MAP:2,USE_COVER:3,USE_COVER_ONLY:4,SKIP:5},Tt=Object.keys(h).map(n=>`const float TERRAIN_MODE_${n} = ${h[n]}.0;`).join(`
`),I=Tt+`
uniform terrainUniforms {
  float mode;
  vec4 bounds;
} terrain;

uniform sampler2D terrain_map;
`,M={name:"terrain",dependencies:[g],vs:I+"out vec3 commonPos;",fs:I+"in vec3 commonPos;",inject:{"vs:#main-start":`
if (terrain.mode == TERRAIN_MODE_SKIP) {
  gl_Position = vec4(0.0);
  return;
}
`,"vs:DECKGL_FILTER_GL_POSITION":`
commonPos = geometry.position.xyz;
if (terrain.mode == TERRAIN_MODE_WRITE_HEIGHT_MAP) {
  vec2 texCoords = (commonPos.xy - terrain.bounds.xy) / terrain.bounds.zw;
  position = vec4(texCoords * 2.0 - 1.0, 0.0, 1.0);
  commonPos.z += project.commonOrigin.z;
}
if (terrain.mode == TERRAIN_MODE_USE_HEIGHT_MAP) {
  vec3 anchor = geometry.worldPosition;
  anchor.z = 0.0;
  vec3 anchorCommon = project_position(anchor);
  vec2 texCoords = (anchorCommon.xy - terrain.bounds.xy) / terrain.bounds.zw;
  if (texCoords.x >= 0.0 && texCoords.y >= 0.0 && texCoords.x <= 1.0 && texCoords.y <= 1.0) {
    float terrainZ = texture(terrain_map, texCoords).r;
    geometry.position.z += terrainZ;
    position = project_common_position_to_clipspace(geometry.position);
  }
}
    `,"fs:#main-start":`
if (terrain.mode == TERRAIN_MODE_WRITE_HEIGHT_MAP) {
  fragColor = vec4(commonPos.z, 0.0, 0.0, 1.0);
  return;
}
    `,"fs:DECKGL_FILTER_COLOR":`
if ((terrain.mode == TERRAIN_MODE_USE_COVER) || (terrain.mode == TERRAIN_MODE_USE_COVER_ONLY)) {
  vec2 texCoords = (commonPos.xy - terrain.bounds.xy) / terrain.bounds.zw;
  vec4 pixel = texture(terrain_map, texCoords);
  if (terrain.mode == TERRAIN_MODE_USE_COVER_ONLY) {
    color = pixel;
  } else {
    // pixel is premultiplied
    color = pixel + color * (1.0 - pixel.a);
  }
  return;
}
    `},getUniforms:(n={})=>{if("dummyHeightMap"in n){const{drawToTerrainHeightMap:e,heightMap:t,heightMapBounds:i,dummyHeightMap:r,terrainCover:s,useTerrainHeightMap:o,terrainSkipRender:a}=n,l=g.getUniforms(n.project),{commonOrigin:u}=l;let c=a?h.SKIP:h.NONE,d=r,f=null;return e?(c=h.WRITE_HEIGHT_MAP,f=i):o&&t?(c=h.USE_HEIGHT_MAP,d=t,f=i):s&&(d=(n.isPicking?s.getPickingFramebuffer():s.getRenderFramebuffer())?.colorAttachments[0].texture,n.isPicking&&(c=h.SKIP),d?(c=c===h.SKIP?h.USE_COVER_ONLY:h.USE_COVER,f=s.bounds):d=r),{mode:c,terrain_map:d,bounds:f?[f[0]-u[0],f[1]-u[1],f[2]-f[0],f[3]-f[1]]:[0,0,0,0]}}return{}},uniformTypes:{mode:"f32",bounds:"vec4<f32>"}};function T(n,e){return n.createFramebuffer({id:e.id,colorAttachments:[n.createTexture({id:e.id,...e.float&&{format:"rgba32float",type:5126},mipmaps:!1,sampler:e.interpolate===!1?{minFilter:"nearest",magFilter:"nearest"}:{minFilter:"linear",magFilter:"linear"}})]})}class Et{constructor(e){this.isDirty=!0,this.renderViewport=null,this.bounds=null,this.layers=[],this.targetBounds=null,this.targetBoundsCommon=null,this.targetLayer=e,this.tile=te(e)}get id(){return this.targetLayer.id}get isActive(){return!!this.targetLayer.getCurrentLayer()}shouldUpdate({targetLayer:e,viewport:t,layers:i,layerNeedsRedraw:r}){e&&(this.targetLayer=e);const s=t?this._updateViewport(t):!1;let o=i?this._updateLayers(i):!1;if(r){for(const a of this.layers)if(r[a]){o=!0;break}}return o||s}_updateLayers(e){let t=!1;if(e=this.tile?Ct(this.tile,e):e,e.length!==this.layers.length)t=!0;else for(let i=0;i<e.length;i++)if(e[i].id!==this.layers[i]){t=!0;break}return t&&(this.layers=e.map(i=>i.id)),t}_updateViewport(e){const t=this.targetLayer;let i=!1;if(this.tile&&"boundingBox"in this.tile){if(!this.targetBounds){i=!0,this.targetBounds=this.tile.boundingBox;const s=e.projectPosition(this.targetBounds[0]),o=e.projectPosition(this.targetBounds[1]);this.targetBoundsCommon=[s[0],s[1],o[0],o[1]]}}else this.targetBounds!==t.getBounds()&&(i=!0,this.targetBounds=t.getBounds(),this.targetBoundsCommon=E([t],e));if(!this.targetBoundsCommon)return!1;const r=Math.ceil(e.zoom+.5);if(this.tile)this.bounds=this.targetBoundsCommon;else{const s=this.renderViewport?.zoom;i=i||r!==s;const o=F(this.targetBoundsCommon,e),a=this.bounds;i=i||!a||o.some((l,u)=>l!==a[u]),this.bounds=o}return i&&(this.renderViewport=C({bounds:this.bounds,zoom:r,viewport:e})),i}getRenderFramebuffer(){return!this.renderViewport||this.layers.length===0?null:(this.fbo||(this.fbo=T(this.targetLayer.context.device,{id:this.id})),this.fbo)}getPickingFramebuffer(){return!this.renderViewport||this.layers.length===0&&!this.targetLayer.props.pickable?null:(this.pickingFbo||(this.pickingFbo=T(this.targetLayer.context.device,{id:`${this.id}-picking`,interpolate:!1})),this.pickingFbo)}filterLayers(e){return e.filter(({id:t})=>this.layers.includes(t))}delete(){const{fbo:e,pickingFbo:t}=this;e&&(e.colorAttachments[0].destroy(),e.destroy()),t&&(t.colorAttachments[0].destroy(),t.destroy())}}function Ct(n,e){return e.filter(t=>{const i=te(t);return i?Ft(n.boundingBox,i.boundingBox):!0})}function te(n){for(;n;){const{tile:e}=n.props;if(e)return e;n=n.parent}return null}function Ft(n,e){return n&&e?n[0][0]<e[1][0]&&e[0][0]<n[1][0]&&n[0][1]<e[1][1]&&e[0][1]<n[1][1]:!1}const kt={blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"};class At extends j{getRenderableLayers(e,t){const{layers:i}=t,r=[],s=this._getDrawLayerParams(e,t,!0);for(let o=0;o<i.length;o++){const a=i[o];!a.isComposite&&s[o].shouldDrawLayer&&r.push(a)}return r}renderHeightMap(e,t){const i=e.getRenderFramebuffer(),r=e.renderViewport;!i||!r||(i.resize(r),this.render({...t,target:i,pass:"terrain-height-map",layers:t.layers,viewports:[r],effects:[],clearColor:[0,0,0,0]}))}renderTerrainCover(e,t){const i=e.getRenderFramebuffer(),r=e.renderViewport;if(!i||!r)return;const s=e.filterLayers(t.layers);i.resize(r),this.render({...t,target:i,pass:`terrain-cover-${e.id}`,layers:s,effects:[],viewports:[r],clearColor:[0,0,0,0]})}getLayerParameters(e,t,i){return{...e.props.parameters,blend:!0,depthCompare:"always",...e.props.operation.includes("terrain")&&kt}}getShaderModuleProps(e,t,i){return{terrain:{project:i.project}}}}class wt extends he{constructor(){super(...arguments),this.drawParameters={}}getRenderableLayers(e,t){const{layers:i}=t,r=[];this.drawParameters={},this._resetColorEncoder(t.pickZ);const s=this._getDrawLayerParams(e,t);for(let o=0;o<i.length;o++){const a=i[o];!a.isComposite&&s[o].shouldDrawLayer&&(r.push(a),this.drawParameters[a.id]=s[o].layerParameters)}return r}renderTerrainCover(e,t){const i=e.getPickingFramebuffer(),r=e.renderViewport;if(!i||!r)return;const s=e.filterLayers(t.layers),o=e.targetLayer;o.props.pickable&&s.unshift(o),i.resize(r),this.render({...t,pickingFBO:i,pass:`terrain-cover-picking-${e.id}`,layers:s,effects:[],viewports:[r],cullRect:void 0,deviceRect:r,pickZ:!1})}getLayerParameters(e,t,i){let r;return this.drawParameters[e.id]?r=this.drawParameters[e.id]:(r=super.getLayerParameters(e,t,i),r.blend=!0),{...r,depthCompare:"always"}}getShaderModuleProps(e,t,i){return{terrain:{project:i.project}}}}const O=2048;class B{static isSupported(e){return e.isTextureFormatRenderable("rgba32float")}constructor(e){this.renderViewport=null,this.bounds=null,this.layers=[],this.layersBounds=[],this.layersBoundsCommon=null,this.lastViewport=null,this.device=e}getRenderFramebuffer(){return this.renderViewport?(this.fbo||(this.fbo=T(this.device,{id:"height-map",float:!0})),this.fbo):null}shouldUpdate({layers:e,viewport:t}){const i=e.length!==this.layers.length||e.some((s,o)=>s!==this.layers[o]||s.props.transitions||s.getBounds()!==this.layersBounds[o]);i&&(this.layers=e,this.layersBounds=e.map(s=>s.getBounds()),this.layersBoundsCommon=E(e,t));const r=!this.lastViewport||!t.equals(this.lastViewport);if(!this.layersBoundsCommon)this.renderViewport=null;else if(i||r){const s=F(this.layersBoundsCommon,t);if(s[2]<=s[0]||s[3]<=s[1])return this.renderViewport=null,!1;this.bounds=s,this.lastViewport=t;const o=t.scale,a=(s[2]-s[0])*o,l=(s[3]-s[1])*o;return this.renderViewport=a>0||l>0?C({bounds:[t.center[0]-1,t.center[1]-1,t.center[0]+1,t.center[1]+1],zoom:t.zoom,width:Math.min(a,O),height:Math.min(l,O),viewport:t}):null,!0}return!1}delete(){this.fbo&&(this.fbo.colorAttachments[0].delete(),this.fbo.delete())}}class Rt{constructor(){this.id="terrain-effect",this.props=null,this.useInPicking=!0,this.isPicking=!1,this.isDrapingEnabled=!1,this.terrainCovers=new Map}setup({device:e,deck:t}){this.dummyHeightMap=e.createTexture({width:1,height:1,data:new Uint8Array([0,0,0,0])}),this.terrainPass=new At(e,{id:"terrain"}),this.terrainPickingPass=new wt(e,{id:"terrain-picking"}),B.isSupported(e)?this.heightMap=new B(e):y.warn("Terrain offset mode is not supported by this browser")(),t._addDefaultShaderModule(M)}preRender(e){if(e.pickZ){this.isDrapingEnabled=!1;return}const{viewports:t}=e,i=e.pass.startsWith("picking");this.isPicking=i,this.isDrapingEnabled=!0;const r=t[0],s=(i?this.terrainPickingPass:this.terrainPass).getRenderableLayers(r,e),o=s.filter(l=>l.props.operation.includes("terrain"));if(o.length===0)return;i||s.filter(u=>u.state.terrainDrawMode==="offset").length>0&&this._updateHeightMap(o,r,e);const a=s.filter(l=>l.state.terrainDrawMode==="drape");this._updateTerrainCovers(o,a,r,e)}getShaderModuleProps(e,t){const{terrainDrawMode:i}=e.state;return{terrain:{project:t.project,isPicking:this.isPicking,heightMap:this.heightMap?.getRenderFramebuffer()?.colorAttachments[0].texture||null,heightMapBounds:this.heightMap?.bounds,dummyHeightMap:this.dummyHeightMap,terrainCover:this.isDrapingEnabled?this.terrainCovers.get(e.id):null,useTerrainHeightMap:i==="offset",terrainSkipRender:i==="drape"||!e.props.operation.includes("draw")}}}cleanup({deck:e}){this.dummyHeightMap&&(this.dummyHeightMap.delete(),this.dummyHeightMap=void 0),this.heightMap&&(this.heightMap.delete(),this.heightMap=void 0);for(const t of this.terrainCovers.values())t.delete();this.terrainCovers.clear(),e._removeDefaultShaderModule(M)}_updateHeightMap(e,t,i){!this.heightMap||!this.heightMap.shouldUpdate({layers:e,viewport:t})||this.terrainPass.renderHeightMap(this.heightMap,{...i,layers:e,shaderModuleProps:{terrain:{heightMapBounds:this.heightMap.bounds,dummyHeightMap:this.dummyHeightMap,drawToTerrainHeightMap:!0},project:{devicePixelRatio:1}}})}_updateTerrainCovers(e,t,i,r){const s={};for(const o of t)o.state.terrainCoverNeedsRedraw&&(s[o.id]=!0,o.state.terrainCoverNeedsRedraw=!1);for(const o of this.terrainCovers.values())o.isDirty=o.isDirty||o.shouldUpdate({layerNeedsRedraw:s});for(const o of e)this._updateTerrainCover(o,t,i,r);this.isPicking||this._pruneTerrainCovers()}_updateTerrainCover(e,t,i,r){const s=this.isPicking?this.terrainPickingPass:this.terrainPass;let o=this.terrainCovers.get(e.id);o||(o=new Et(e),this.terrainCovers.set(e.id,o));try{const a=o.shouldUpdate({targetLayer:e,viewport:i,layers:t});(this.isPicking||o.isDirty||a)&&(s.renderTerrainCover(o,{...r,layers:t,shaderModuleProps:{terrain:{dummyHeightMap:this.dummyHeightMap,terrainSkipRender:!1},project:{devicePixelRatio:1}}}),this.isPicking||(o.isDirty=!1))}catch(a){e.raiseError(a,`Error rendering terrain cover ${o.id}`)}}_pruneTerrainCovers(){const e=[];for(const[t,i]of this.terrainCovers)i.isActive||e.push(t);for(const t of e)this.terrainCovers.delete(t)}}const Lt={terrainDrawMode:void 0};class ie extends _{getShaders(){return{modules:[M]}}initializeState(){this.context.deck?._addDefaultEffect(new Rt)}updateState(e){const{props:t,oldProps:i}=e;if(this.state.terrainDrawMode&&t.terrainDrawMode===i.terrainDrawMode&&t.extruded===i.extruded)return;let{terrainDrawMode:r}=t;if(!r){const s=this.props.extruded,o=this.getAttributeManager()?.attributes,a=o&&"instancePositions"in o;r=s||a?"offset":"drape"}this.setState({terrainDrawMode:r})}onNeedsRedraw(){const e=this.state;e.terrainDrawMode==="drape"&&(e.terrainCoverNeedsRedraw=!0)}}ie.defaultProps=Lt;ie.extensionName="TerrainExtension";export{N as BrushingExtension,J as ClipExtension,jt as CollisionFilterExtension,W as DataFilterExtension,q as FillStyleExtension,qe as Fp64Extension,ee as MaskExtension,Vt as PathStyleExtension,ie as _TerrainExtension,$e as project64};
