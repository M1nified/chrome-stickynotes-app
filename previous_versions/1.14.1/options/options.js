$(document).ready(function(){
	displayNotifications1();
	setCheckboxListeners();
	loadNotesManager();
	loadSharedNotesManager();
	loadSyncStorageNotes();
	loadServiceMenu();
})
var displayNotifications1 = function(){
	chrome.storage.sync.get("notifications1",function(data){
		if(data && data.notifications1){
			$("#notifications1").attr("checked",data.notifications1);
		}else{
			$("#notifications1").attr("checked",true);
			chrome.storage.sync.set({notifications1:true});
		}
	})
}
var setCheckboxListeners = function(){
	$("input[type=checkbox]").on("change",function(){
		var data = {};
		data[$(this).attr('id')] = this.checked;
		chrome.storage.sync.set(data);
	})
}
var loadNotesManager = function(){
	$(".localNotes tbody").empty().append("<li>Loading...</li>");
	var openRequest = indexedDB.open("notes");
	openRequest.onupgradeneeded = function(e) {
		var db = openRequest.result;
		var store = db.createObjectStore("notes", {keyPath: "id"});
		var idIndex = store.createIndex("by_id", "id", {unique: true});
	}
	openRequest.onsuccess = function(e) {
		console.log("Success!");
		db = e.target.result;
		var tx=db.transaction("notes","readwrite");
		var store = tx.objectStore("notes");
		var index = store.index("by_id");

		var items = [];

		tx.oncomplete = function(evt) {  
			$(".localNotes tbody").empty();
			for(i in items){
				var noterow = "<td>"+items[i].id+"</td><td>"+items[i].textarea.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, " ").slice(0,40)+"</td><td>"+toTimeStamp(items[i].date)+"</td>";
				$(".localNotes tbody").append("<tr>"+ noterow +"</tr>");
			}
		};
		var cursorRequest = store.openCursor();
		cursorRequest.onerror = function(error) {
			console.log(error);
		};
		cursorRequest.onsuccess = function(evt) {                    
			var cursor = evt.target.result;
			if (cursor) {
				items.push(cursor.value);
				cursor.continue();
			}
		};
	}
	openRequest.onerror = function(e) {
		console.log("Error");
		console.dir(e);
	}	
}
var loadSharedNotesManager = function(){
	chrome.storage.sync.get("id_owner",function(data){
		var id_owner = data.id_owner;
		$.get("http://prowebject.com/stickynotes/sharebox/getNotesByUser.php?id_owner="+id_owner,function(result){
			//console.log(result);
			$(".sharedNotes tbody").empty();
			var items = null;
			try{
				items = JSON.parse(result);
			}catch(e){}
			if(items){
				for(i in items){
					var noterow = "<td><a class='clicker removeSharedNote' link='"+ items[i].link_remove +"'>DELETE</a></td><td><a target='_blank' href='"+ items[i].link_note +"'>"+ items[i].id_note +"</a></td><td>"+ items[i].note.textarea.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, " ").slice(0,40) +"</td><td>"+ toTimeStamp(parseInt(items[i].note.date)) +"</td>"
					$(".sharedNotes tbody").append("<tr>"+ noterow +"</tr>");
				}
			}
			$("a.removeSharedNote").on("click",function(){
				$.get($(this).attr('link'),function(req){
					loadSharedNotesManager();
				})
			})
		})
	})
}
var loadSyncStorageNotes = function(){
	$(".syncStorageNotes tbody").empty().append("<li>Loading...</li>");
	chrome.storage.sync.get(null,function(data){
		var allonlinekeys = Object.keys(data);
		var notes = [];
		var notesJSON = {};
		$(".syncStorageNotes tbody").empty();
		for(i in allonlinekeys){
			if(/note_\w+/.test(allonlinekeys[i])){
				var noterow = "<td><button class='copyFromSyncStorageToIndexedDB' noteID='"+data[allonlinekeys[i]].id+"'>IMPORT</button></td><td><button class='removeFromSyncStorage' noteID='"+data[allonlinekeys[i]].id+"'>REMOVE</button></td><td>"+data[allonlinekeys[i]].id+"</td><td>"+data[allonlinekeys[i]].textarea.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, " ").slice(0,40)+"</td><td>"+toTimeStamp(data[allonlinekeys[i]].date)+"</td>";
				$(".syncStorageNotes tbody").append("<tr>"+ noterow +"</tr>");
			}
		}
		$("button.copyFromSyncStorageToIndexedDB").on("click",function(){
			console.log()
			var id = $(this).attr("noteID");
			chrome.storage.sync.get("note_"+id,function(data){
				var note = data["note_"+id];
				if(note){
					console.log(data["note_"+id]);
					var openRequest = indexedDB.open("notes");
					openRequest.onsuccess = function(e) {
						db = e.target.result;
						var tx=db.transaction("notes","readwrite");
						var store = tx.objectStore("notes");
						var index = store.index("by_id");

						var request = index.get(note.id);
						request.onsuccess = function(){
							var put = store.put(note);
							put.onsuccess = function(){
								loadNotesManager();
							}
						}
					}
				}
			})
		})
		$("button.removeFromSyncStorage").on("click",function(){
			console.log()
			var id = $(this).attr("noteID");
			chrome.storage.sync.remove("note_"+id,function(data){
				loadSyncStorageNotes();
			})
		})
	})
}
var loadServiceMenu = function(){
	$("button.memoryFullReset").on("click",memoryFullReset);
	$("button.memoryIndexedDBClear").on("click",memoryIndexedDBClear);
	$("button.memoryChromeLocalStorageClear").on("click",memoryChromeLocalStorageClear);
	$("button.memoryChromeSyncStorageClear").on("click",memoryChromeSyncStorageClear);
	//$("button.memoryGoogleDriveClear").on("click",memoryGoogleDriveClear);
}
var memoryFullReset = function(){
	memoryIndexedDBClear();
	//memoryGoogleDriveClear();
	memoryChromeSyncStorageClear();
	memoryChromeLocalStorageClear();
}
var memoryIndexedDBClear = function(){
	var openRequest = indexedDB.open("notes");
	openRequest.onsuccess = function(e) {
		db = e.target.result;
		var tx=db.transaction("notes","readwrite");
		var store = tx.objectStore("notes");
		var index = store.index("by_id");
		var items = [];
		tx.oncomplete = function(evt) {  
			//console.log(items);
		};
		var cursorRequest = store.openCursor();
		cursorRequest.onerror = function(error) {
			console.log(error);
		};
		cursorRequest.onsuccess = function(evt) {                    
			var cursor = evt.target.result;
			if (cursor) {
				items.push(cursor.value);
				cursor.continue();
			}
			for(i in items){
				store.delete(items[i].id);
			}
		};
	}
	openRequest.onerror = function(e) {
		console.log("Error");
		console.dir(e);
	}
}
var memoryChromeLocalStorageClear = function(){
	chrome.storage.local.clear(function(){

	})
}
var memoryChromeSyncStorageClear = function(){
	chrome.storage.sync.clear(function(){

	})
}
/*var memoryGoogleDriveClear = function(){
	chrome.syncFileSystem.requestFileSystem(function(fs){
		var dirReader = fs.root.createReader();
		var fileEntries = [];
		var readEntries = function(){
			dirReader.readEntries(function(results){
				if(!results.length){
					fileEntries.forEach(function(fileEntry,i){
						fileEntry.remove(function(){

						});
					});
				}else{
					useFileEntries(results.sort(),notesoffline);
					fileEntries.concat(toArray(results));
					readEntries();
				}
			},function(e){console.log(e);});
		};
		readEntries();
	})
}*/