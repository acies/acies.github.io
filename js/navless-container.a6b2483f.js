(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["navless-container"],{"7c26":function(e,t,n){"use strict";n.r(t);var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("theme-toggle"),n("div",{staticClass:"view"},[n("router-view")],1)],1)},c=[],r=n("eb6e"),s={name:"NavlessContainer",components:{ThemeToggle:r["a"]}},l=s,o=n("2877"),i=Object(o["a"])(l,a,c,!1,null,null,null);t["default"]=i.exports},"7dda":function(e,t,n){"use strict";n.d(t,"a",(function(){return c})),n.d(t,"b",(function(){return r}));var a="acies";function c(e){try{var t=localStorage.getItem("".concat(a,":").concat(e));try{if(null!==t)return JSON.parse(t)}catch(n){}return t}catch(n){console.error(n)}return null}function r(e,t){try{localStorage.setItem("".concat(a,":").concat(e),t)}catch(n){console.error(n)}}},"8dca":function(e,t,n){"use strict";var a=n("99ec"),c=n.n(a);c.a},"99ec":function(e,t,n){},eb6e:function(e,t,n){"use strict";var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"toggle",attrs:{"data-theme":e.theme,"data-enter-theme":e.enterTheme,"data-prev-theme":e.prevTheme},on:{click:e.toggle,mouseenter:function(t){e.enterTheme=e.theme}}},[n("icon",{staticClass:"sun",attrs:{name:"wb_sunny",size:"l"}}),n("icon",{staticClass:"cloud",attrs:{name:"cloud",size:"l"}}),n("div",{staticClass:"label"},["dark"===e.theme?n("span",[e._v("Shine some light!")]):e._e(),"light"===e.theme?n("span",[e._v("Call upon darkness!")]):e._e()])],1)},c=[],r=n("7dda"),s={data:function(){return{theme:Object(r["a"])("theme")||"dark",enterTheme:null,prevTheme:null}},watch:{theme:{handler:function(e,t){document.documentElement.classList.add(e),t&&document.documentElement.classList.remove(t),this.prevTheme=t,this.enterTheme=null},immediate:!0}},methods:{toggle:function(){"dark"===this.theme?this.theme="light":this.theme="dark",Object(r["b"])("theme",this.theme)}}},l=s,o=(n("8dca"),n("2877")),i=Object(o["a"])(l,a,c,!1,null,"ff26fd42",null);t["a"]=i.exports}}]);
//# sourceMappingURL=navless-container.a6b2483f.js.map