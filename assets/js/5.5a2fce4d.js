(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{252:function(e,t,r){},301:function(e,t,r){"use strict";var n=r(252);r.n(n).a},305:function(e,t,r){"use strict";r.r(t);r(280),r(282),r(285),r(233),r(99),r(33),r(231),r(18),r(286);var n=r(303),s=r(298),a=r(299),i=r(300);function o(e){return["and","or","not.and","not.or"].includes(e)}function c(e,t,r=""){var n;return(t=null===(n=t)||void 0===n?void 0:n.toString())?`${e}${t}${r}`:""}class p extends URL{constructor(e,t,r={}){super((e+"/"+t).replace(/\/+/g,"/"),window.location.href),Object(s.a)(this,"subQueries",{}),l.set(this,{writable:!0,value:void 0}),Object(i.a)(this,l,e);const{columns:a,select:o,order:c,limit:p,offset:u,on_conflict:d}=r,f=Object(n.a)(r,["columns","select","order","limit","offset","on_conflict"]);d&&this.searchParams.append("on_conflict",d),a&&this.searchParams.append("columns",a),this._appendSelect(o),this._appendOrder(c),this._appendLimit(p),this._appendOffset(u),this._appendConditions(f),this._appendSubQueryParams(this)}_appendSubQueryParams(e,t=""){for(let[r,n]of Object.entries(e.subQueries)){r=c(""+t,r);for(const[e,t]of n.searchParams.entries())["columns","select"].includes(e)||this.searchParams.append(`${r}.${e}`,t);this._appendSubQueryParams(n,r)}}_appendSelect(e){"object"!=typeof e||Array.isArray(e)?e&&this.searchParams.append("select",e.toString()):this.searchParams.append("select",this._parseSelectObject(e))}_parseSelectObject(e,t=[]){return Object.entries(e).map(([e,r])=>{if(!r)return;if(null==r?void 0:r.select){const t=e.split(":",1)[0].split("!",1)[0],n=new p(Object(a.a)(this,l),t,r);return this.subQueries[t]=n,`${e}(${n.searchParams.get("select")})`}let s,i="",o="",u=[];if(e.includes(":")?[i,s]=e.split(":"):s=e,"string"==typeof r)o=r;else if("object"==typeof r){let e;var d=r;if(({"::":o}=d),e=Object(n.a)(d,["::"]),u=this._parseSelectObject(e,[...t,s]),u.length>0&&!i&&!o)return u}return[c("",i,":")+[...t,s].join("->")+c("::",o),u]}).flat(2).filter(Boolean).join(",")}_appendOrder(e){Array.isArray(e)?this.searchParams.append("order",e.map(e=>Array.isArray(e)?e.join("."):e).join(",")):"object"==typeof e?this.searchParams.append("order",Object.entries(e).map(([e,t])=>t&&"string"==typeof t?`${e}.${t}`:e).join(",")):e&&this.searchParams.append("order",e)}_appendLimit(e){e&&this.searchParams.append("limit",e)}_appendOffset(e){e&&this.searchParams.append("offset",e)}_appendConditions(e){for(const{key:t,value:r}of this._parseConditions(e))this.searchParams.append(t,r)}_parseConditions(e,t=""){return Object.entries(e).map(([e,r])=>{var n;const s=e.split(":");if(o(e=null!==(n=s[1])&&void 0!==n?n:s[0])){if(!r||"object"!=typeof r||Array.isArray(r))throw new Error("no object for logical operator");if(t)throw new Error("logical operators can't be nested with json operators");return{key:e,value:`(${this._parseConditions(r).map(({key:e,value:t})=>o(e)?`${e}${t}`:`${e}.${t}`).join(",")})`}}{if(void 0===r)return;const[n,...s]=e.split(".");let a;switch(s[s.length-1]){case"in":a=this._valueToString(r,"()");break;case void 0:if(r&&"object"==typeof r)return this._parseConditions(r,c("",t,"->")+n);default:a=this._valueToString(r)}return{key:c("",t,"string"==typeof r?"->>":"->")+n,value:[...s,a].join(".")}}}).flat().filter(Boolean)}_valueToString(e,t="{}"){if(null===e)return"null";if("boolean"==typeof e)return e.toString();if(Array.isArray(e))return t.charAt(0)+e.map(e=>this._valueToString(e)).join(",")+t.charAt(1);if("object"==typeof e){const{lower:t,includeLower:r=!0,upper:n,includeUpper:s=!1}=e;return(r?"[":"(")+t+","+n+(s?"]":")")}return r=(r=e).toString(),[",",".",":","(",")"].find(e=>r.includes(e))||["null","true","false"].includes(r)?`"${r}"`:r;var r}}var l=new WeakMap,u=p,d={props:{content:String},data:()=>({code:void 0}),computed:{query(){if(this.code){const e=Function(`"use strict";${this.code};return query`)();return decodeURIComponent(new u("/","",e).search)}}},mounted(){this.code=this.$refs.wrap.innerText}},f=(r(301),r(10)),h=Object(f.a)(d,(function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",[r("div",{ref:"wrap",staticClass:"slot-wrapper"},[e._t("default")],2),e._v(" "),r("div",{staticClass:"language-none output-wrapper"},[r("pre",{staticClass:"language-none"},[e._v("      "),r("code",[e._v("\n        "),r("span",[e._v(e._s(e.query))]),e._v("\n      ")]),e._v("\n    ")])])])}),[],!1,null,"6fd32615",null);t.default=h.exports}}]);