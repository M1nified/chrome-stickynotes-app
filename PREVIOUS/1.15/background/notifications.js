var notifyNewNote = function(note){
	var opt = {
		type:"basic",
		iconUrl:chrome.runtime.getURL("/img/icon_128.png"),
		title:"New note stored! (" + getTime() + ")",
		message:"Click app icon to load it. ("+note.textarea.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, " ").slice(0,40)+")"
	}
	chrome.notifications.create(note.id,opt,function(){});
}
var notifyUpdatedNote = function(note){
	var opt = {
		type:"basic",
		iconUrl:chrome.runtime.getURL("/img/icon_128.png"),
		title:"A note has been updated! (" + getTime() + ")",
		message:"Click app icon to load it. ("+note.textarea.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, " ").slice(0,40)+")"
	}
	chrome.notifications.create(note.id,opt,function(){});
}