"use strict";var notes=window.notes||[];$(function(){chrome.storage.sync.get(["allLaunch","isStoreOpen"],function(n){var o=n.allLaunch;o===!0?$("#showalways").attr("checked",!0):o===!1&&$("#showalways").attr("checked",!1);var e=n.isStoreOpen;e||$(".storedependent").css("display","none")}),notes&&notes.length&&0!==notes.length?displayNotes(notes):(console.log("GET MYSELF"),updateNotes()),$(".openall").on("click",function(){openAllNotes()}),$(".openallclose").on("click",function(){openAllNotes(function(){window.close()})}),$(document).on("click",".notecolor",function(){var n=$(this).data("note"),o=jQuery.grep(notes,function(o,e){return o.id===n});o&&o[0]&&(o=o[0],Notes.openNote(o))}),$("#showalways").on("change",function(){var n=$(this).is(":checked");chrome.storage.sync.set({allLaunch:n},function(){})}),$(".addnote").on("click",function(){chrome.runtime.sendMessage({func:"openNewNote"})}),$(".opensettings").on("click",function(){chrome.app.window.create("/options/main.html",{innerBounds:{width:800,height:600}})}),$(".openstore").on("click",function(){chrome.app.window.create("/store/purchase.html",{innerBounds:{width:800,height:600}})}),$(".opendonate").on("click",function(){})});var displayNotes=function(n){var o=$("#noteslist").empty();for(var e in n){var t=n[e];t.removed||o.append('<li><table><tr><td><span class="notecolor" data-note="'+t.id+'" style="background-color:'+t.color+';"></span></td><td class="notecontent" style="font-family:'+t.fontfamily+'"><div>'+t.textarea+'</div></td><td><span class="openbutton" data-note="'+t.id+'" style="background-color:'+t.color+';">Open</span></td></tr></li>')}},openAllNotes=function(n){var o=function(){e--,0===e&&"function"==typeof n&&n()},e=0;console.log("NOTES",notes);for(var t in notes){var s=notes[t];Note.isRemoved(s)||(e++,Notes.openNote(s).then(function(){o()})["catch"](function(n){o()}))}},updateNotes=function(n){n&&n.length>0?(notes=n,displayNotes(n)):IndexedDB.getNotes().then(function(n){var o=!1,e=!0,t=!1,s=void 0;try{for(var a,c=function(){var n=a.value,e=jQuery.grep(notes,function(o,e){return o.id===n.id});return e&&(Note.isContentTheSame(n,e)||n.removed!==n.removed)?(o=!0,"break"):void 0},i=n[Symbol.iterator]();!(e=(a=i.next()).done);e=!0){var r=c();if("break"===r)break}}catch(l){t=!0,s=l}finally{try{!e&&i["return"]&&i["return"]()}finally{if(t)throw s}}notes=n,o&&displayNotes(n)})};