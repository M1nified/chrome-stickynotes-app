function isNotesContentSame(note1,note2){
	//skips id, date, window settings, sorted menu items
	var arethesame = true;
	var differences = {};
	if(note1.textarea !== note2.textarea){
		differences.textarea = true;
	}
	if(note1.color !== note2.color){
		differences.color = true;
	}
	if(note1.fontfamily !== note2.fontfamily){
		differences.fontfamily = true;
	}
	if(note1.fontsize !== note2.fontsize){
		differences.fontsize = true;
	}
	if(Object.keys(differences).length==0){
		return true;
	}else{
		return differences;
	}
}