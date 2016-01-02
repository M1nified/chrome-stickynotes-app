"use strict";function _classCallCheck(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function e(e,n){for(var t=0;t<n.length;t++){var o=n[t];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(n,t,o){return t&&e(n.prototype,t),o&&e(n,o),n}}(),Notes=function(){function e(){_classCallCheck(this,e)}return _createClass(e,null,[{key:"randomId",value:function(){var e=new Date;return e.valueOf()+"_"+Math.random().toString().slice(2)}},{key:"openNewNote",value:function(e,n){chrome.app.window.create("/note/note.html",{id:this.randomId(),frame:"none",bounds:{width:250,height:240},resizable:!0},function(t){t.contentWindow.note=null,t.contentWindow.presetcolor=e||null,t.contentWindow.presetfont=n||null,chrome.app.window.get(t.id).onClosed.addListener(function(){syncAll()})})}},{key:"openNote",value:function(e){var n=new Promise(function(n,t){try{if(!e)throw"openNote, no note object";var o=chrome.app.window.get(e.id);o?(console.log("SHOW"),o.show(),n()):(console.log("MAKE"),chrome.app.window.create("/note/note.html",{id:e.id,frame:"none"},function(t){t.contentWindow.note=e,chrome.app.window.get(e.id).onClosed.addListener(function(){syncAll()}),n()}))}catch(r){t(r)}});return n}},{key:"launchNotes",value:function(e){if(!e)return!1;var n=!0,t=!0,o=!1,r=void 0;try{for(var a,i=e[Symbol.iterator]();!(t=(a=i.next()).done);t=!0){var l=a.value;Note.isRemoved(l)||(n=!1)}}catch(c){o=!0,r=c}finally{try{!t&&i["return"]&&i["return"]()}finally{if(o)throw r}}if(!e||0===e.length||n)return!1;var u=!0,s=!1,f=void 0;try{for(var d,h=e[Symbol.iterator]();!(u=(d=h.next()).done);u=!0){var l=d.value;Note.isRemoved(l)||this.openNote(l)}}catch(c){s=!0,f=c}finally{try{!u&&h["return"]&&h["return"]()}finally{if(s)throw f}}return!0}},{key:"launchNotesNewIfEmpty",value:function(e){return this.launchNotes(e)===!1&&this.openNewNote(),!0}},{key:"updateDisplayedNotes",value:function(){}},{key:"updateDisplayedNote",value:function(){}}]),e}();