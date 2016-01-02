"use strict";$(document).ready(function(){displayNotifications1(),displayStartupPanel(),loadPWJsyncManager(),displayAutostart1(),setCheckboxListeners(),setSpeechToTextLangs(),loadNotesManager(),loadSharedNotesManager(),loadSyncStorageNotes(),loadGDriveFilesManager(),loadServiceMenu(),loadImportExportMenu()});var displayNotifications1=function(){chrome.storage.sync.get("notifications1",function(e){e&&e.notifications1?$("#notifications1").attr("checked",e.notifications1):($("#notifications1").attr("checked",!0),chrome.storage.sync.set({notifications1:!0}))})},displayStartupPanel=function(){chrome.storage.sync.get("allLaunch",function(e){e=e.allLaunch,e===!0?$("#startuppanel1").attr("checked",!1):$("#startuppanel1").attr("checked",!0)})},displayPWJsyncManager=function(){chrome.storage.sync.get(["pwj_sync","pwj_pair_code"],function(e){$("#pwj_login").empty(),e&&e.pwj_sync&&e.pwj_pair_code&&($("#pwj_pair_code").attr("value",e.pwj_pair_code),$("#pwj_sync").attr("checked",e.pwj_sync))})},loadPWJsyncManager=function(){displayPWJsyncManager(),$("#pwj_sync").on("change",function(e){this.checked?chrome.storage.sync.get("pwj_pair_code",function(e){if(e&&e.pwj_pair_code)chrome.storage.sync.set({pwj_sync:!0},function(e){displayPWJsyncManager()});else{var o=("xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx-"+Date.now()).replace(/[xy]/g,function(e){var o=crypto.getRandomValues(new Uint8Array(1))[0]%16|0,t="x"==e?o:3&o|8;return t.toString(16)});chrome.storage.sync.set({pwj_sync:!0,pwj_pair_code:o},function(e){displayPWJsyncManager()})}}):chrome.storage.sync.set({pwj_sync:!1,pwj_login:null})})},displayAutostart1=function(){chrome.storage.sync.get("autorun",function(e){console.log("displayAutostart1",e),e&&"boolean"==typeof e.autorun&&$("#autostart1").attr("checked",e.autorun)})},setSpeechToTextLangs=function(){chrome.storage.sync.get("purchasedinapp",function(e){e&&e.purchasedinapp&&e.purchasedinapp.speech_to_text||$(".s2t").css("display","none")});for(var e in speechToTextLangs){var o=speechToTextLangs[e];if(o)if(2===o.length)$("#speechToTextLang").append('<option code="'+o[1]+'">'+o[0]+"</option>");else if(o.length>2)for(var t=1;t<o.length;t++){var n=o[t];$("#speechToTextLang").append('<option code="'+n[0]+'">'+o[0]+" ("+n[1]+")</option>")}}chrome.storage.sync.get("speechToTextLang",function(e){e=e.speechToTextLang,e&&(console.log($("#speechToTextLang>option[code="+e+"]")[0]),$("#speechToTextLang>option[code="+e+"]").attr("selected","selected"))}),$("#speechToTextLang").on("change",function(){var e=$("#speechToTextLang>option:selected").attr("code");chrome.storage.sync.set({speechToTextLang:e},function(){})})},setCheckboxListeners=function(){$("input[type=checkbox]:not(.prevent)").on("change",function(){var e={};e[$(this).data("name")]=$(this).data("negate")?!this.checked:this.checked,console.log(e),chrome.storage.sync.set(e)})},loadNotesManager=function(){$(".localNotes tbody").empty().append("<li>Loading...</li>");var e=indexedDB.open("notes");e.onupgradeneeded=function(o){var t=e.result,n=t.createObjectStore("notes",{keyPath:"id"});n.createIndex("by_id","id",{unique:!0})},e.onsuccess=function(e){console.log("Success!");var o=e.target.result,t=o.transaction("notes","readwrite"),n=t.objectStore("notes"),r=(n.index("by_id"),[]);t.oncomplete=function(e){$(".localNotes tbody").empty();for(var o in r){var t="<td>"+r[o].id+"</td><td>"+(r[o].textarea?r[o].textarea.replace(/<(?:.|\n)*?>/gm," ").replace(/\s+/g," ").slice(0,40):" ")+"</td><td>"+toTimeStamp(r[o].date)+"</td>";$(".localNotes tbody").append("<tr>"+t+"</tr>")}};var c=n.openCursor();c.onerror=function(e){console.log(e)},c.onsuccess=function(e){var o=e.target.result;o&&(r.push(o.value),o["continue"]())}},e.onerror=function(e){console.log("Error"),console.dir(e)}},loadSharedNotesManager=function e(){chrome.storage.sync.get("id_owner",function(o){var t=o.id_owner;$.get("http://prowebject.com/stickynotes/sharebox/getNotesByUser.php?id_owner="+t,function(o){$(".sharedNotes tbody").empty();var t=null;try{t=JSON.parse(o)}catch(n){}if(t)for(i in t)if(t[i].note){var r="<td><a class='clicker removeSharedNote' link='"+t[i].link_remove+"'>DELETE</a></td><td><a target='_blank' href='"+t[i].link_note+"'>"+t[i].id_note+"</a></td><td>"+t[i].note.textarea.replace(/<(?:.|\n)*?>/gm," ").replace(/\s+/g," ").slice(0,40)+"</td><td>"+toTimeStamp(parseInt(t[i].note.date))+"</td>";$(".sharedNotes tbody").append("<tr>"+r+"</tr>")}$("a.removeSharedNote").on("click",function(){$.get($(this).attr("link"),function(o){e()})})})})},loadSyncStorageNotes=function o(){$(".syncStorageNotes tbody").empty().append("<li>Loading...</li>"),chrome.storage.sync.get(null,function(e){var t=Object.keys(e);$(".syncStorageNotes tbody").empty();for(i in t)if(/note_\w+/.test(t[i])){var n="<td><button class='copyFromSyncStorageToIndexedDB' noteID='"+e[t[i]].id+"'>IMPORT</button></td><td><button class='removeFromSyncStorage' noteID='"+e[t[i]].id+"'>REMOVE</button></td><td>"+e[t[i]].id+"</td><td>"+e[t[i]].textarea.replace(/<(?:.|\n)*?>/gm," ").replace(/\s+/g," ").slice(0,40)+"</td><td>"+toTimeStamp(e[t[i]].date)+"</td>";$(".syncStorageNotes tbody").append("<tr>"+n+"</tr>")}$("button.copyFromSyncStorageToIndexedDB").on("click",function(){console.log();var e=$(this).attr("noteID");chrome.storage.sync.get("note_"+e,function(o){var t=o["note_"+e];if(t){console.log(o["note_"+e]);var n=indexedDB.open("notes");n.onsuccess=function(e){var o=e.target.result,n=o.transaction("notes","readwrite"),r=n.objectStore("notes"),c=r.index("by_id"),a=c.get(t.id);a.onsuccess=function(){var e=r.put(t);e.onsuccess=function(){loadNotesManager()}}}}})}),$("button.removeFromSyncStorage").on("click",function(){console.log();var e=$(this).attr("noteID");chrome.storage.sync.remove("note_"+e,function(e){o()})})})},loadGDriveFilesManager=function(){chrome.syncFileSystem.requestFileSystem(function(o){var t=o.root.createReader(),n=[],r=function c(){t.readEntries(function(o){console.log("run"),console.log(o),o&&o.length?(o.forEach(function(e,o){n.push(e)}),c()):e(n)})};r()});var e=function(e){console.log(e),e.forEach(function(e,o){console.log(o),$(".gDriveFiles>tbody").append("<tr><td>"+o+"</td><td></td><td>"+e.name+"</td><td></td></tr>")})}},loadImportExportMenu=function(){$("#downloadNotes").on("click",function(){chrome.fileSystem.chooseEntry({type:"saveFile",suggestedName:"sticky_notes.sticky_notes"},function(e){var o=indexedDB.open("notes");o.onsuccess=function(o){var t=o.target.result,n=t.transaction("notes","readwrite"),r=n.objectStore("notes"),c=(r.index("by_id"),[]);n.oncomplete=function(o){e.createWriter(function(e){var o=!1;e.onwriteend=function(e){o||(this.truncate(this.position),o=!0)};var t=new Blob([JSON.stringify(c)],{type:"text/plain"});e.write(t)},function(){})};var a=r.openCursor();a.onerror=function(e){console.log(e)},a.onsuccess=function(e){var o=e.target.result;o&&(c.push(o.value),o["continue"]())}},o.onerror=function(e){console.log("Error"),console.dir(e)}})}),$("#uploadNotes").on("click",function(){chrome.fileSystem.chooseEntry({type:"openFile",suggestedName:"sticky_notes.sticky_notes"},function(e){e.file(function(e){var o=new FileReader;o.onloadend=function(){var e=null;try{e=JSON.parse(this.result)}catch(o){errorHandler(o)}e&&chrome.runtime.getBackgroundPage(function(o){o.saveNotesToIndexedDB(e)})},o.readAsText(e)})})})},closeAllNotes=function(){var e=chrome.app.window.getAll();console.log(e);for(var o in e)!function(e){e.contentWindow.saveNote(function(){e.close()})}(e[o])},loadServiceMenu=function(){$("button.memoryFullReset").on("click",memoryFullReset),$("button.memoryIndexedDBClear").on("click",memoryIndexedDBClear),$("button.memoryChromeLocalStorageClear").on("click",memoryChromeLocalStorageClear),$("button.memoryChromeSyncStorageClear").on("click",memoryChromeSyncStorageClear)},memoryFullReset=function(){memoryIndexedDBClear(),memoryChromeSyncStorageClear(),memoryChromeLocalStorageClear()},memoryIndexedDBClear=function(){var e=indexedDB.open("notes");e.onsuccess=function(e){var o=e.target.result,t=o.transaction("notes","readwrite"),n=t.objectStore("notes"),r=(n.index("by_id"),[]);t.oncomplete=function(e){};var c=n.openCursor();c.onerror=function(e){console.log(e)},c.onsuccess=function(e){var o=e.target.result;o&&(r.push(o.value),o["continue"]());for(var t in r)n["delete"](r[t].id)}},e.onerror=function(e){console.log("Error"),console.dir(e)}},memoryChromeLocalStorageClear=function(){chrome.storage.local.clear(function(){})},memoryChromeSyncStorageClear=function(){chrome.storage.sync.clear(function(){})};