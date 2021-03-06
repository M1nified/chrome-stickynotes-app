alreadystarted = false;
notesofflinemain = null;
launched = true;
options = {notifications1:true,autostart1:false};
pwj_pair_code = null;
pwj_sync = null;
chrome.storage.sync.get(options,function(data){
	if(data){
		options = data;
	}
	/*if(options.autostart1 === true && alreadystarted === false){
		runApp();
	}*/
})
chrome.storage.onChanged.addListener(function(changes,areaName){
	if(changes.pwj_sync){
		pwj_sync = changes.pwj_sync.newValue;
	}
	if(changes.pwj_pair_code){
		pwj_pair_code = changes.pwj_pair_code.newValue;
	}
	if(areaName == "sync"){
		var keys = Object.keys(changes);
		for(i in keys){
			if(options[keys[i]] !== undefined){
				options[keys[i]] = changes[keys[i]].newValue;
			}
		}
	}
})
chrome.app.runtime.onLaunched.addListener(function() {
	runApp();
	updatePurchasedElements();
	storeAvailabilityCheck();
});
var runApp = function(){
	alreadystarted = true;
	console.log("LAUNCH!")
	launched = false;
	chrome.storage.sync.get({id_owner:null},function(data){
		id_owner = data.id_owner;
		if(id_owner === null){
			var d = new Date();
			id_owner = d.valueOf()+"_"+Math.random().toString().slice(2);
			chrome.storage.sync.set({id_owner:id_owner});
		}
	})
	chrome.storage.sync.get(["pwj_sync","pwj_pair_code"],function(data){//sprawdzanie rodzaju synchronizacji
		if(data && data.pwj_sync && data.pwj_pair_code){
			pwj_sync = data.pwj_sync;
			pwj_pair_code = data.pwj_pair_code;
		}else{
			pwj_sync = false;
			pwj_pair_code = null;
		}
		continueLaunching();
	})
}
var continueLaunching = function(){
	var openRequest = indexedDB.open("notes",4);
	openRequest.onupgradeneeded = function(e) {
		console.log("IndexedDB upgrade needed.");
		console.log(e);
		var db = e.target.result;
		db.onerror = function(event) {
			alert("Database error: " + event.target.errorCode);
		};
		try{
			var store = db.createObjectStore("notes", {keyPath: "id"});
			var idIndex = store.createIndex("by_id", "id", {unique: true});
		}catch(e){
			console.log(e);
		}
	}
	openRequest.onsuccess = function(e) {
		console.log("Success! (1)");
		//console.log(e)
		db = this.result;
		db.onerror = function(event) {
			alert("Database error: " + event.target.errorCode);
		};
		var tx = null;
		try{
			tx = db.transaction("notes","readwrite");
		}catch(e){
			console.log(e)
			return false;
		}
		var store = tx.objectStore("notes");
		var index = store.index("by_id");

		var items = [];

		tx.oncomplete = function(evt) {
			//console.log(items)
			//console.log(items.length)
			clearRemovedFromIndexedDB();
			if(pwj_sync && pwj_pair_code){//synchronizacja z PWJ
				synchronizeWithPWJ(items);
			}else{//synchronizacja z Google Drive
				synchronizeWithSyncFileSystem(items);
			}
			launchNotes(items);
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
var openNewNote = function(presetcolor,presetfont){
	var d = new Date();
	chrome.app.window.create('/background/note.html',{id:d.valueOf()+"_"+Math.random().toString().slice(2),frame:'none',bounds:{width:250,height:240},resizable:true},function(createdWindow){
		createdWindow.contentWindow.note = null;
		createdWindow.contentWindow.presetcolor = presetcolor || null;
		createdWindow.contentWindow.presetfont = presetfont || null;
		chrome.app.window.get(createdWindow.id).onClosed.addListener(function(){
			syncAll();
		})
	})
}
var launchNotes = function(notes){
	notes = $.grep(notes,function(n,i){if(n.removed!==true){return true;}})
	//console.log(notes)
	if(notes == null || notes.length == 0){
		openNewNote();
	}else{
		chrome.storage.sync.get("allLaunch",function(allLaunch){
			allLaunch = allLaunch.allLaunch;
			if(allLaunch){
				for(var i in notes){
					var note = notes[i];
					if(note.removed === true){
						continue;
					}
					(function(note){
						chrome.app.window.create('background/note.html',{id:note.id,frame:'none'},function(createdWindow){
							createdWindow.contentWindow.note = note;
							chrome.app.window.get(note.id).onClosed.addListener(function(){
								syncAll();
							})
						})
					})(note);
				}
			}else{
				chrome.app.window.create('background/noteslauncher.html',{id:"notes_launcher",innerBounds:{width:430,height:540},frame:{color:"#8C8C8C"}},function(createdWindow){
					createdWindow.contentWindow.notes = notes;
				})
			}
		})
	}
}
var updateDisplayedNotes = function(){
	var windows = chrome.app.window.getAll();
	for(i in windows){
		windows[i].contentWindow.updateNote();
	}
}
var updateDisplayedNote = function(note){
	if(!note || note.id===undefined){
		return false;
	}
	var windo = chrome.app.window.get(note.id);
	if(windo){
		try{
			windo.contentWindow.updateNote();
		}catch(e){
			//console.log(note.id);
			errorHandler(e);
		}
	}else{
		//launchNotes([note]);
	}
}

var syncAllDelayedTimeouted = null;
var syncAll = function(){
	clearTimeout(syncAllDelayedTimeouted);
	var oreq = indexedDB.open("notes");
	oreq.onupgradeneeded = function(e) {
		var db = oreq.result;
		var store = db.createObjectStore("notes", {keyPath: "id"});
		var idIndex = store.createIndex("by_id", "id", {unique: true});
	}
	oreq.onsuccess = function(e) {
		console.log("Success! (2)");
		db = e.target.result;
		var tx=db.transaction("notes","readwrite");
		var store = tx.objectStore("notes");
		var index = store.index("by_id");

		var items = [];

		tx.oncomplete = function(evt) {
			if(pwj_sync && pwj_pair_code){//synchronizacja z PWJ
				synchronizeWithPWJ(items);
			}else{//synchronizacja z Google Drive
				synchronizeWithSyncFileSystem(items);
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
	oreq.onerror = function(e) {
		console.log("Error");
		console.dir(e);
	}
}
var syncAllDelayed = function(){
	clearTimeout(syncAllDelayedTimeouted);
	syncAllDelayedTimeouted = setTimeout(syncAll,10000);
}
var synchronizeWithPWJ = function(notesoffline){
	var notes = {};
	notesofflinemain = notesoffline;
	for(i in notesoffline){
		notes[notesoffline[i].id]=notesoffline[i];
	}
	$.ajax({
		url:'http://prowebject.com/stickynotes/web/panel/backend/getNotes.php',
		dataType:'json',
		method:'post',
		data:{pair_code:pwj_pair_code}
	}).done(function(data){
		//pobrano notatki z pwj
		console.log(data)
		var offline = {};
		for(i in notesoffline){
			offline[notesoffline[i].id] = notesoffline[i];
		}
		var notes = {};
		for(i in data){//wstawianie aktualizacji z pwj
			data[i].note_object=JSON.parse(data[i].note_object);
			data[i].last_update=parseInt(data[i].last_update);
			if(!Boolean(data[i].note_object.removed) && (!offline[data[i].note_object.id] || offline[data[i].note_object.id].date < data[i].note_object.date || offline[data[i].note_object.id].date < data[i].last_update)){
				notes[data[i].note_object.id]=data[i].note_object
			}
		}
		for(i in offline){//wstawianie pozostalych lokalnych
			if(!notes[offline[i].id] && Boolean(offline[i].removed)!==true){
				notes[offline[i].id]=offline[i];
			}
		}
		saveNotesToIndexedDB(notes);
		sendNotesToPWJ(notes);
	})
}
var sendNotesToPWJ = function(notes){
	var d = {notes:notes,pair_code:pwj_pair_code,clear:true};
	//console.log(d)
	//console.log(JSON.stringify({notes:notes}))
	$.ajax({
		url:'http://prowebject.com/stickynotes/web/panel/backend/putNotes.php',
		method:'post',
		dataType:'text',
		data:d
	}).done(function(data){
		console.log(data)
		clearRemovedFromIndexedDB();
		//notes were saved
		//console.log(data)
	})
}
var synchronizeWithSyncFileSystem = function(notesoffline){
	var notes = [];
	notesofflinemain = notesoffline;
	//console.log(notesoffline)
	//console.log(Object.keys(notesoffline))
	//console.log(notesoffline[0])
	for(i in notesoffline){
		//console.log(notesoffline[i]);
		//notes[i] = notesoffline[i];
		notes.push(notesoffline[i])
	}
	try{
		chrome.syncFileSystem.requestFileSystem(function(fs){requestFileSystemCallback(fs,notes)});
	}catch(e){
		console.log(e);
	}
}
var requestFileSystemCallback = function(fs,notesoffline){
	if(chrome.runtime.lastError || !fs){
		console.log("NOT SYNCED (filesystem not returned)");
		console.log(chrome.runtime.lastError);
		return false;
	}
	var dirReader = fs.root.createReader();
	var fileEntries = [];
	var readEntries = function(){
		dirReader.readEntries(function(results){
			if(!results.length){
				useFileEntries(fileEntries.sort(),notesoffline);
			}else{
				useFileEntries(results.sort(),notesoffline);
				fileEntries.concat(toArray(results));
				readEntries();
			}
		},function(e){console.log(e);});
	};
	readEntries();
}
var useFileEntries = function(fileEntries,notesoffline){
	//console.log(fileEntries)
	fileEntries.forEach(function(fileEntry,i){
		//console.log(fileEntry);
		updateFile(fileEntry,notesoffline);
	})
	uploadNewNotes(fileEntries,notesoffline);
}
var uploadNewNotes = function(fileEntries,notesoffline){
	for(i in notesoffline){
		var id = notesoffline[i].id;
		var matches = $.grep(fileEntries,function(n,i){if(n.name == "note_"+id)return true;});
		if(matches.length == 0){
			(function(note){
				chrome.syncFileSystem.requestFileSystem(function(fs){
					fs.root.getFile("note_"+note.id,{create:true},function(fileEntry){
						writeToFile(fileEntry,note);
					},errorHandler);
				});
			})(notesoffline[i]);
		}
	}
}
var updateFileSingle = function(fileEntry){
	fileEntry.file(function(file){
		var reader = new FileReader();
		reader.onloadend = function(){
			var note = {};
			try{
				note = JSON.parse(this.result);
			}catch(e){
				errorHandler(e);
			}
			if(note && note.removed){
				fileEntry.remove(function(){console.log("REMOVED")},errorHandler);
				return false;
			}
			if(note){
				var openRequest = indexedDB.open("notes");
				openRequest.onsuccess = function(e) {
					db = e.target.result;
					var tx=db.transaction("notes","readwrite");
					var store = tx.objectStore("notes");
					var index = store.index("by_id");
					var request = index.get(note.id);
					request.onsuccess = function(){
						if(!request.result){
							saveNotesToIndexedDB([note]);
							if(options.notifications1){notifyNewNote(note);}
						}else{
							var newnote = synchronizeVersions([request.result],note);
							saveNotesToIndexedDB([newnote]);
							if(!isNotesContentSame(note,newnote)){
								writeToFile(newnote);
							}else{
								updateDisplayedNote(newnote);
								if(options.notifications1){notifyUpdatedNote(newnote);}
							}
						}
					}
				}
			}
		}
		reader.readAsText(file);
	})
}
var updateFile = function(fileEntry,notesoffline){
	if(/note_(\w|_)+/.test(fileEntry.name)){
		fileEntry.file(function(file){
			var reader = new FileReader();
			reader.onloadend = function(){
				var json;
				try{
					json = JSON.parse(this.result);
				}catch(e){
					json = null;
				}
				//console.log(json);
				if(json !== null){
					var newnote = synchronizeVersions(notesoffline,json);
					if(newnote.removed){
						fileEntry.remove(function(){console.log("REMOVED")},errorHandler);
					}else{
						saveNotesToIndexedDB([newnote]);
						if(!isNotesContentSame(json,newnote)){
							writeToFile(newnote);
						}else{
							updateDisplayedNote(newnote);
						}
					}
				}
				clearRemovedFromIndexedDB();
			}
			reader.readAsText(file);
		})
	}
}
var synchronizeVersions = function(notesoffline,noteonline){
	var noteoffline = $.grep(notesoffline,function(n,i){if(n.id===noteonline.id)return true;});
	var newnote = {};
	if(noteoffline.length == 1){
		if(noteoffline[0].date < noteonline.date){
			newnote = noteonline;
		}else{
			newnote = noteoffline[0];
		}
	}else{
		newnote = noteonline;
	}
	return newnote;
}
var writeToFile = function(fileEntry,note){
	fileEntry.createWriter(function(fileWriter) {
		var truncated = false;
		fileWriter.onwriteend = function(e) {
			if(!truncated){
				this.truncate(this.position);
				truncated = true;
			}
		};
		fileWriter.onerror = function(e) {
			console.log('Write failed: ' + e.toString());
		};
		//console.log(JSON.stringify(notes))
		var blob = new Blob([JSON.stringify(note)], {type: 'text/plain'});
			//fileWriter.seek(0);
			fileWriter.write(blob);
		}, function(error){
			console.log(error.toString())
		});
}
var toClipboard = function(str,sendResponse){
	$("#clipboardholder").attr('value',str);
	document.getElementById('clipboardholder').select();
	//based on http://stackoverflow.com/a/12693636
	document.oncopy = function(event) {
		//console.log(str)
		event.clipboardData.setData("Text", str);
		event.preventDefault();
	};
	//console.log(str);
	var cpy = document.execCommand('Copy');
	document.oncopy = undefined;
	//console.log(cpy);
	sendResponse({status:cpy});
}
var clearRemovedFromIndexedDB = function(){
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
				if(Boolean(items[i].removed) === true){
					store.delete(items[i].id);
				}
			}
		};
	}
	openRequest.onerror = function(e) {
		console.log("Error");
		console.dir(e);
	}
}
var saveNotesToIndexedDB = function(notes){
	var openRequest = indexedDB.open("notes");
	openRequest.onsuccess = function(e) {
		db = e.target.result;
		var tx=db.transaction("notes","readwrite");
		var store = tx.objectStore("notes");
		var index = store.index("by_id");
		for(var i in notes){
			var note = notes[i];
			if(note.removed === true){
				store.delete(note.id);
			}else{
				store.put(note);
			}
		}
	}
	openRequest.onerror = function(e) {
		console.log("Error");
		console.dir(e);
	}
}

/*var getShopData = function(){
	google.payments.inapp.getSkuDetails({
		'parameters': {'env': 'prod'},
		'success': function(resp){
			console.log("SHOP OK:")
			console.log(resp)
		},
		'failure': function(resp){
			console.log("SHOP ERR:")
			console.log(resp)
		}
	});
}*/

chrome.syncFileSystem.onFileStatusChanged.addListener(function(details){
	onFileStatusChanged(details);
})
var onFileStatusChanged = function(details){
	if(/note_(\w|_)+/.test(details.fileEntry.name) && details.direction === "remote_to_local"){
		updateFileSingle(details.fileEntry);
	}else if(details.fileEntry.name === "purchasedinapp" && details.direction === "remote_to_local"){
		updatePurchasedElements();
	}
}

chrome.runtime.onMessage.addListener(function(msg,sender,sendResponse){
	switch(msg.func){
		case "openNewNote":
		openNewNote(msg.presetcolor,msg.presetfont);
		break;
		case "syncAll":
		syncAll();
		break;
		case "syncAllDelayed":
		syncAllDelayed();
		break;
		case "toClipboard":
		toClipboard(msg.val,sendResponse);
		break;
	}
})

//STORE
var storeAvailabilityCheck = function(){
	//console.log("CHECK")
	/*if(!navigator.onLine){
		setIsStoreOpen(false);
		setTimeout(function(){storeAvailabilityCheck();},1000);
		return;
	}*/
	google.payments.inapp.getSkuDetails({
		'parameters':{'env':'prod'},
		'success':onSkuDetails,
		'failure':onSkuDetailsFail
	})
}
var setIsStoreOpen = function(state){
	chrome.storage.local.set({isStoreOpen:state});
	setTimeout(function(){storeAvailabilityCheck();},30000);
}
var onSkuDetails = function(sku){
	try{
		if(sku.response.details.inAppProducts.length>0){
			setIsStoreOpen(true);
		}else{
			setIsStoreOpen(false);
		}
	}catch(err){
		setIsStoreOpen(false);
	}
}
var onSkuDetailsFail = function(sku){
	setIsStoreOpen(false);
}
var updatePurchasedElements = function(){
	google.payments.inapp.getPurchases({
		'parameters': {'env': 'prod'},
		'success': onLicenseUpdate,
		'failure': onLicenseUpdateFail
	});
}
var onLicenseUpdate = function(resp){
	//console.log(resp);
	var prodsArr = resp.response.details;
	var appid = chrome.runtime.id.toString();
	var newlist = {};
	for(var i in prodsArr){
		if(prodsArr[i].state!=="ACTIVE"){
			continue;
		}
		var sku = prodsArr[i].sku.split(appid+"_inapp").join("");
		newlist[sku]=true;
	}
	newlist.speech_to_text = true;//TYMCZASOWE DARMOWE ROZPOZNAWANIE MOWY
	chrome.storage.sync.set({purchasedinapp:newlist});
}
var onLicenseUpdateFail = function(resp){
	//console.log(resp);
	//TYMCZASOWE DARMOWE ROZPOZNAWANIE MOWY
	chrome.storage.sync.get('purchasedinapp',function(data){
		var newlist = {};
		if(data && data.purchasedinapp){
			newlist = data.purchasedinapp;
		}
		newlist.speech_to_text = true;
		chrome.storage.sync.set({purchasedinapp:newlist});
	})
}
//STORE END
