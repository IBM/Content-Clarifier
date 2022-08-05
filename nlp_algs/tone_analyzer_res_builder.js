var C = require('../constants.js');
var responseObj={};
//var sentenceArray=[];

exports.toneAnalyzerGenerateResponseObj = function(level,mode,analyzedText, originalText) {
	if(C.DEBUG_VERBOSE_LOGGING) console.log(' response builder=== '+JSON.stringify(analyzedText.document_tone.tone_categories[0].category_name));
	if(C.DEBUG_VERBOSE_LOGGING) console.log(' response builder=== '+JSON.stringify(analyzedText.sentences_tone[0].tone_categories[0].category_name));	
	var document_tone=analyzedText.document_tone;
        var sentences_tone=analyzedText.sentences_tone;  
	if(C.DEBUG_VERBOSE_LOGGING) console.log("Analyzed text :  " + JSON.stringify(analyzedText.sentences_tone));
     	
    	
    	if(level!== undefined && level !== null || (mode!== undefined && mode !== null)){
    		
    		 if(level.toLowerCase() == C.TONEANALYZER_DOCUMENT_LEVEL && mode.toLowerCase() == C.TONEANALYZER_MODE_TONE){
    			    responseObj = { status: "OK",
    		            usage: C.TERM_OF_USE_MESSAGE,
    		            tones: getDocumentTone(document_tone),
			    original: originalText
    		            };
    			         
    		    	    if(C.DEBUG_VERBOSE_LOGGING) console.log(' Generated Tone Analyzer Response: level=document, mode =tone.');
    				 return responseObj;
    		 }
    		
    
	    	if(level.toLowerCase() == C.TONEANALYZER_SENTENCE_LEVEL && mode.toLowerCase() == C.TONEANALYZER_MODE_TONE){
			    	responseObj = {
					 status: "OK",
					usage: C.TERM_OF_USE_MESSAGE,
					sentences: getSentenceTone(sentences_tone),
					original: originalText
			     	  };	
		    		return responseObj;
			 	 if(C.DEBUG_VERBOSE_LOGGING) console.log(' Generated Tone Analyzer Response: level=sentence, mode =tone.');
		}
	    	if(level.toLowerCase() == C.TONEANALYZER_DOCUMENT_LEVEL && mode.toLowerCase() == C.TONEANALYZER_MODE_ASSERTIVE){
	    		responseObj = { status: "OK",
		        usage: C.TERM_OF_USE_MESSAGE,
		        assertiveness: getAssertiveness(document_tone).assert,
	    			score:getAssertiveness(document_tone).score,
				original: originalText
		       };
	    		return responseObj;
		   if(C.DEBUG_VERBOSE_LOGGING) console.log(' Generated Tone Analyzer Response: level=document, mode =asssertiveness.');
		}
		else{
			responseObj = { status: "OK",
		        usage: C.TERM_OF_USE_MESSAGE,
		        //sentences:getSentenceAssertiveness(sentences_tone);
			original: originalText
		    };
			return responseObj;
			if(C.DEBUG_VERBOSE_LOGGING) console.log(' Generated Tone Analyzer Response: level=sentence, mode =asssertiveness.');
		}
    	
    	
    	}else{
		responseObj = { status: "OK",
    		            usage: C.TERM_OF_USE_MESSAGE,
    		            tones: getDocumentTone(document_tone),
			    sentences: getSentenceTone(sentences_tone),
			    original: originalText
    		            };
    			 if(C.DEBUG_VERBOSE_LOGGING) console.log(' Generated Tone Analyzer Response for both levels and mode=tone');         
	}	
	return responseObj;
};


function getDocumentTone(document_tone){
	if(C.DEBUG_VERBOSE_LOGGING) console.log('inside get document tone');
	var toneArray=[];
	var toneScores=document_tone.tone_categories[0].tones;
	for(var i=0;i< toneScores.length;i++){
		var toneJson={tone:"",score:""};
		toneJson.tone=toneScores[i].tone_name;
		toneJson.score=toneScores[i].score;
		toneArray.push(toneJson);
		//if(C.DEBUG_VERBOSE_LOGGING) console.log('cnt =='+i);
	}
	//if(C.DEBUG_VERBOSE_LOGGING) console.log("output tone array "+JSON.stringify(toneArray,null,2));
	return toneArray;
	
	}

function  getSentenceTone(sentences_tone){
	if(C.DEBUG_VERBOSE_LOGGING) console.log('inside get Sentence tone');
	var sentenceArray=[];
	for(var c=0;c<sentences_tone.length;c++){
		var rec =sentences_tone[c];
		//if(C.DEBUG_VERBOSE_LOGGING) console.log("printing rec"+JSON.stringify(rec.sentence_id));
		
		var sentenceJson={
				sentence: "",
				tones: []
		};
		
        rec.text = rec.text.replace(/\\\"/g, '\"');   //g global, matches all instances found, replaces " with \" ?

		sentenceJson.sentence=rec.text;
		
		if(rec.tone_categories[0] !=undefined){
		for(var i=0;i< rec.tone_categories[0].tones.length;i++){
			
			var sen=rec.tone_categories[0].tones[i];
			
			var toneJson={tone:"",score:""};
			toneJson.tone=sen.tone_name;
			toneJson.score=sen.score;
			
			sentenceJson.tones.push(toneJson);
		}
		}
		sentenceArray.push(sentenceJson);
	}
	if(C.DEBUG_VERBOSE_LOGGING) console.log("output tone array "+JSON.stringify(sentenceArray));
	return sentenceArray;
}

function getAssertiveness(document_tone){
	
	var assertJson={assert:"",score:0};
	
	var tones =getDocumentTone(document_tone);
	
	var passiveArray = findPassiveScoreArray(tones);
	
	var passiveScore = calculateAverageScore(passiveArray);
	
	var aggresssiveArray = findAggressiveScoreArray(tones);
	
	var aggresssiveScore = calculateAverageScore(aggresssiveArray); 
	
	if(C.DEBUG_VERBOSE_LOGGING) console.log('passiveScore '+passiveScore);
	if(C.DEBUG_VERBOSE_LOGGING) console.log('aggresssiveScore '+aggresssiveScore);
	
	if(passiveScore>=0.75){
		if(C.DEBUG_VERBOSE_LOGGING) console.log('inside passive if ');
		assertJson.assert="passive";
		assertJson.score=passiveScore;
		return assertJson;
	}
	if(aggresssiveScore>=0.75){
		if(C.DEBUG_VERBOSE_LOGGING) console.log('inside aggresssive if ');
		assertJson.assert="aggressive";
		assertJson.score=aggresssiveScore;
		return assertJson;
	}
	
	return assertJson;
	
}


function calculateAverageScore(scoreArr){
	
	//var assertJson={assert:"",score:""};
	
	//return assertJson;
	var total=0;
	var avg=0;
	if(scoreArr!=null){
		if(scoreArr.length>0){
	for(var i=0;i<scoreArr.length;i++){
		total+=scoreArr[i];
	}
	avg=total/scoreArr.length;
	return avg;
	}
	}
	return avg;
}


function findPassiveScoreArray(tones){
	var passiveArray=[];	
	
	if(tones.length>0 && tones!=undefined && tones != null){
		for (var t=0;t<tones.length;t++){
			var assertScore='';
			if(tones[t].tone.toLowerCase()=="joy" ||tones[t].tone.toLowerCase()=="sadness"){
				
				assertScore=tones[t].score;
				passiveArray.push(assertScore);
				
			}
		}
	}
	
	return passiveArray;
	
}

function findAggressiveScoreArray(tones){
	
var aggresssiveArray=[];	
	
	if(tones.length>0 && tones!=undefined && tones != null){
		for (var t=0;t<tones.length;t++){
			var assertScore='';
			if(tones[t].tone.toLowerCase()=="anger" || tones[t].tone.toLowerCase()==" disgust" || tones[t].tone.toLowerCase()=="fear"){
				
				assertScore=tones[t].score;
				aggresssiveArray.push(assertScore);
				
			}
		}
	}
	
	return aggresssiveArray;
	
}


