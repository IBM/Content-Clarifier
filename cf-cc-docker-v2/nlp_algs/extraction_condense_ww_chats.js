//
// Implements Statistical Classification Using A Logistic Regression Function 
// For Clustering of Chat Messages to Generate A Summary
//
//

var Tokenizer           = require('sentence-tokenizer');
var wordCounter         = require('word-count');

var turnsMap            = {}; // Structure for all turns in the convo 
var sentenceMap         = {}; // Struture for all sentences in the convo
var sProbMap            = {}; // Structure for conditional probability of the participant given any word
var tProbMap            = {}; // Structure for conditional probability of the turn given any word
var participantArr      = []; // Array for unique participants in the convo
var summaryArr          = []; // Output array of summarized messages

var STATISTICAL_CLASSIFY_THRESHOLD = 0;

var MESSAGE_FORMAT = null;
    
/* word-count feature NORMALIZED by the longest sentence in the conversation */
/* Sentence length has previously been found to be an effective feature in speech and text summarization */
function getFeatureSLEN(sentence){
       
    text = sentence.Text;
    
    console.log("getFeatureSLEN: " + text );
    
    var slen = -1;
        
    var tokenizer = new Tokenizer('Chuck');
    
    if(text === undefined || text.length == 0){
        return 0;
    }
   
    tokenizer.setEntry(text);

    tokenizer.getSentences(); // must call before get tokens
    
    //console.log(tokenizer.getTokens());
    
    words = tokenizer.getTokens();
    
    // 1. Get word count of this sentence
    var word_count = words.length;
    console.log("Word count = " + word_count);
   
    
    // 2. Get word count of longest sentence in convo
    var i = 0;
    var arr = [];
    for(sentence in sentenceMap){
        arr.push(sentenceMap[sentence]);
    }    
    arr.sort( predicatBy("Length") ); 
    //console.log(arr);
    
    
    var compSentences = [];
    for(sentence in sentenceMap)
    {   
        if(sentenceMap[sentence].Text === undefined || sentenceMap[sentence].Text.length == 0) continue;

        tokenizer.setEntry(sentenceMap[sentence].Text);
        tokenizer.getSentences();

        var compStructure = {
            "Text" : sentenceMap[sentence].Text,
            "word_count" : tokenizer.getTokens().length
        };

        compSentences.push(compStructure);
    }
    
    
    compSentences.sort( predicatBy("word_count") ); 
    
    console.log(compSentences);
    
    console.log("Long sentence = ");
    console.log(compSentences[compSentences.length-1].Text);
    
    var longSentenceWords = compSentences[compSentences.length-1].word_count;
      
    console.log("longSentenceWords = " + longSentenceWords);
   
    slen = word_count / longSentenceWords;
    
    console.log("[[ SLEN ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + slen);
   
    return slen;
    
}

/* word-count feature NORMALIZED by the longest sentence in the turn */
/* Sentence length has previously been found to be an effective feature in speech and text summarization */
function getFeatureSLEN2(sentence){
    
    var i = 0;
    var slen2 = -1;   

    text = sentence.Text;
    
    // 1. Get the word count of the sentence
    console.log("getFeatureSLEN2: " + text );
    
    var slen = -1;
        
    var tokenizer = new Tokenizer('Chuck');
    
    if(text === undefined || text.length == 0){
        return 0;
    }
    
    tokenizer.setEntry(text);

    tokenizer.getSentences(); // must call before get tokens
    
    //console.log(tokenizer.getTokens());
    
    words = tokenizer.getTokens();
    
    var word_count = words.length;
    console.log("Word count = " + word_count);

    
    // 2. Get the word count of longest sentence in the turn
    
    var turn = turnsMap[sentence.TurnID];   
    //console.log(turn);
    
    // Get all sentences in the turn for comparison
    var sentencesInTurn = [];         
    for(i = 0; i<turn.length; i++)
    {   
        tokenizer.setEntry(turn[i].Message);

        sentencesInTurn = sentencesInTurn.concat(tokenizer.getSentences());

    }
        
    // Get number of words for each sentence in turn
    var compSentences = [];
    for(i = 0; i<sentencesInTurn.length; i++)
    {   
        tokenizer.setEntry(sentencesInTurn[i]);
        tokenizer.getSentences();

        var compStructure = {
            "Text" : sentencesInTurn[i],
            "word_count" : tokenizer.getTokens().length
        };

        compSentences.push(compStructure);

    }
      
    compSentences.sort( predicatBy("word_count") ); 
    
    console.log(compSentences);
    
  
    console.log("Long Sentence in Turn = ");
 
    console.log(compSentences[compSentences.length-1].Text);
    
    var longSentenceWords = compSentences[compSentences.length-1].word_count;
      
    console.log("longSentenceWords = " + longSentenceWords);
   
    slen2 = word_count / longSentenceWords;
    
    console.log("[[ SLEN2 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + slen2);
    
    return slen2;
    
}


/* position of the sentence in the turn */
/* informativeness might significantly correlate with this structure */
function getFeatureTLOC(sentence){
    
    var tloc = 0;
    
    var numSentencesInTurn = 0;
    
    // Normalize by number of sentenced in the turn
    
    var text = sentence.Text;
    console.log("getFeatureTLOC " + text);
    console.log("Position = " + sentence.PositionInTurn );
    
    for(currSentence in sentenceMap){
        if(sentenceMap[currSentence].TurnID == sentence.TurnID)
            numSentencesInTurn++;
    }
    
    console.log("Sentences in Turn: " + numSentencesInTurn);
    
    tloc = sentence.PositionInTurn / numSentencesInTurn;
    
    console.log("[[ TLOC ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + tloc);
    
    return tloc;

}


/* position of the sentence in the conversation */
/* informativeness might significantly corre- late with this structure */
function getFeatureCLOC(sentence){
    
    var cloc = 0;
    
    var numSentencesInConvo = 0;
      
    // Normalize by number of sentences in the convo

    var text = sentence.Text;
    console.log("getFeatureCLOC " + text);
    console.log("Position = " + sentence.PositionInConvo );
    
    
   for(currSentence in sentenceMap){
            numSentencesInConvo++;
    }
    
    console.log("Sentences in Convo: " + numSentencesInConvo);
     
    cloc = sentence.PositionInConvo / numSentencesInConvo;
    
    console.log("[[ CLOC ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + cloc);
    
    return cloc;
}



/* time from the beginning of the conversation to the current turn */
/* informativeness might significantly correlate with this structure */
function getFeatureTPOS1(sentence){
    var tpos1 = -1;
    
    // Normalize by length of conversation
    var sentenceCnt = 0;
    for(currSent in sentenceMap){
        sentenceCnt++;
    }
        
    var startTimeInMS = sentenceMap['0'].TimeStamp; // start of convo    
    var endTimeInMS = sentenceMap[sentenceCnt-1].TimeStamp; // end of convo
    var durationInMS = Math.abs(endTimeInMS - startTimeInMS);    
    var currentTurnTime = sentence.TimeStamp;
    
    timeDiffInMS = Math.abs( currentTurnTime - startTimeInMS );
    
    tpos1 = timeDiffInMS / durationInMS;
    
    console.log("currentTurnTime " + currentTurnTime);
    console.log("startTimeInMS " + startTimeInMS);
    console.log("timeDiff " + timeDiffInMS);
    console.log("durationInMS " + durationInMS);    
    console.log("[[ TPOS1 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + tpos1);
    
    return tpos1;
}


/* time from the current turn to the end of the conversation */
/* informativeness might significantly corre- late with this structure */
function getFeatureTPOS2(sentence){
    var tpos2 = -1;
    
    var sentenceCnt = 0;
    for(currSent in sentenceMap){
        sentenceCnt++;
    }
  
    var startTimeInMS = sentenceMap['0'].TimeStamp; // start of convo    
    var endTimeInMS = sentenceMap[sentenceCnt-1].TimeStamp;
    var durationInMS = Math.abs(endTimeInMS - startTimeInMS);     
    var currentTurnTime = sentence.TimeStamp;
    
    timeDiffInMS = Math.abs( endTimeInMS - currentTurnTime );
    
    tpos2 = timeDiffInMS / durationInMS;
    
    console.log("endTimeInMS " + endTimeInMS);
    console.log("currentTurnTime " + currentTurnTime);
    console.log("timeDiff " + timeDiffInMS);
    console.log("durationInMS " + durationInMS); 
    console.log("[[ TPOS2 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>= " + tpos2);    
    
    return tpos2;
    
}


/* the time between the following turn and the current turn  NORMALIZED by duration of the conversation */
/* features may be useful if informative turns tend to elicit a large number of responses in a short period of time, or if they tend to quickly follow a preceding turn */
function getFeatureSPAU(sentence){
    
    console.log("getFeatureSPAU");
    
    var i, timeDiffInMS, spau = -1;

    var currTurnID = parseInt(sentence.TurnID, 10);
    var nextTurnID = (currTurnID+1).toString();
    var nextTurn = turnsMap[nextTurnID];
    if(nextTurn === undefined || nextTurn === null){ // current turn is last turn
        console.log("getFeatureSPAU - Returning due to undefined next turn");
        return 0;
    }
    
    var sentenceCnt = 0;
    for(currSent in sentenceMap){
        sentenceCnt++;
    }
    
    var startTimeInMS = sentenceMap['0'].TimeStamp; // start of convo    
    var endTimeInMS = sentenceMap[sentenceCnt-1].TimeStamp; // end of convo
    var durationInMS = Math.abs(endTimeInMS - startTimeInMS);
  
    
    var currentTurnTime = sentence.TimeStamp;
  
    var startTimeOfNextTurn = nextTurn[0].TimeStamp;
        
    timeDiffInMS = Math.abs( startTimeOfNextTurn - currentTurnTime );
    
    spau = timeDiffInMS / durationInMS;

    console.log("currentTurnTime " + currentTurnTime);
    console.log("startTimeOfNextTurn " + startTimeOfNextTurn);
    console.log("timeDiff " + timeDiffInMS);
    console.log("Start to end durationInMS " + durationInMS);
    console.log("[[ SPAU ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + spau);
    
    return spau;

}



/* time between the current turn and previous turn  NORMALIZED by duration of the conversation */
/* features may be useful if informative turns tend to elicit a large number of responses in a short period of time, or if they tend to quickly follow a preceding turn */
function getFeaturePPAU(sentence){
    
    console.log("getFeaturePPAU");
    
    var i, timeDiffInMS, ppau = -1;

    var currTurnID = parseInt(sentence.TurnID, 10);
    var prevTurnID = (currTurnID-1).toString();
    var prevTurn = turnsMap[prevTurnID];
    if(prevTurn === undefined || prevTurn === null){ // current turn is first turn
        console.log("getFeaturePPAU - Returning due to undefined prev turn");
        return 0;
    }
    
    var sentenceCnt = 0;
    for(currSent in sentenceMap){
        sentenceCnt++;
    }
    
    var startTimeInMS = sentenceMap['0'].TimeStamp; // start of convo    
    var endTimeInMS = sentenceMap[sentenceCnt-1].TimeStamp; // end of convo
    var durationInMS = Math.abs(endTimeInMS - startTimeInMS);
  
    
    var currentTurnTime = sentence.TimeStamp;
  
    var endTimeOfPrevTurn = prevTurn[prevTurn.length-1].TimeStamp;
        
    timeDiffInMS = Math.abs( currentTurnTime - endTimeOfPrevTurn );
    
    ppau = timeDiffInMS / durationInMS;

    console.log("currentTurnTime " + currentTurnTime);
    console.log("endTimeOfPrevTurn " + endTimeOfPrevTurn);
    console.log("timeDiff " + timeDiffInMS);
    console.log("Start to end durationInMS " + durationInMS);
    console.log("[[ PPAU ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + ppau);
    
    return ppau;
}



/* how dominant the current participant is in terms of words in the conversation */
/* informative sentences may more often belong to participants who lead the conversation or have a good deal of dominance in the discussion */
/* NOTE: this will be a static feature corresponding to each sentence vector for a given speaker */
function getFeatureDOM(sentence){
    
    var wordsArr = [];
    var allWordsArr = [];
    var dom = 0;
    
    var currParticipant = sentence.ParticipantName;
    
    console.log("currParticipant =" +currParticipant);
    
    var tokenizer = new Tokenizer('Chuck');    
    
    // Normalize by total number of words in conversation
    // 1. Get total number of words in conversation
    for(currSent in sentenceMap){

        if(sentenceMap[currSent].Text === undefined || sentenceMap[currSent].Text.length == 0) continue;

        tokenizer.setEntry(sentenceMap[currSent].Text);

        tokenizer.getSentences(); 

        allWordsArr = allWordsArr.concat(tokenizer.getTokens());            
    }
    
    // 2. Get count for participant
    for(currSent in sentenceMap){
        if(sentenceMap[currSent].ParticipantName == currParticipant){

            if(sentenceMap[currSent].Text === undefined || sentenceMap[currSent].Text.length == 0) continue;

            tokenizer.setEntry(sentenceMap[currSent].Text);
            
            tokenizer.getSentences(); 

            //wordsArr += wordsArr.concat(tokenizer.getTokens());
            
            wordsArr = wordsArr.concat(tokenizer.getTokens());            
        }
    }
 
    console.log(wordsArr);
 
    console.log(" Participant word count " + wordsArr.length);
    console.log(" Total word count " + allWordsArr.length);
    
    dom = wordsArr.length / allWordsArr.length;
    
    console.log("[[ DOM ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + dom);
    
    return dom;
}

/* cosine between the conversation preceding the given sentence and the conversation subsequent to the sentence using Sprob as the vector weights */
/* informative sentences might change the conversation in some fashion, leading to a low cosine between the preceding and subsequent portions */
/* NOTE: Requires MXS, MNS and SMS to be set! */
function getFeatureCOS1(sentence){
    
    // Euclidean normal vectors, then do dot product
    
    //1. Get sentence Euclidean magnitudes
    
    var summation = Math.pow(sentence.MXS, 2) + Math.pow(sentence.MNS, 2) + Math.pow(sentence.SMS, 2);
    
    var sentenceEMag = Math.sqrt(summation);
    
    // Handle NaN
    var sentMXS = isNaN(sentence.MXS / sentenceEMag) ? 0 : sentence.MXS / sentenceEMag;
    var sentMNS = isNaN(sentence.MNS / sentenceEMag) ? 0 : sentence.MNS / sentenceEMag;
    var sentSMS = isNaN(sentence.SMS / sentenceEMag) ? 0 : sentence.SMS / sentenceEMag;
    
    //console.log("getFeatureCOS1:  sentMXS= " + sentMXS + " sentMNS= " + sentMNS + " sentSMS= "+sentSMS);
    
    var i, sum = 0, dotProduct = 0;
    
    for(currSent in sentenceMap){
        
        if(sentenceMap[currSent].Text == sentence.Text) continue; // only evaluate cosine for before and after
 
       // console.log("getFeatureCOS1:  currMXS= " + sentenceMap[currSent].MXS + " currMNS= " + sentenceMap[currSent].MNS + " currSMS= "+sentenceMap[currSent].SMS);
        
        // Get the currSentence Euclidean Magnitude
        summation = Math.pow(sentenceMap[currSent].MXS, 2) + Math.pow(sentenceMap[currSent].MNS, 2) + Math.pow(sentenceMap[currSent].SMS, 2);

       // console.log("summation " + summation);
        
        var currSentenceEMag = Math.sqrt(summation);
        
      //  console.log("currSentenceEMag " + currSentenceEMag);

        var currSentMXS = isNaN(sentenceMap[currSent].MXS / currSentenceEMag) ? 0 : sentenceMap[currSent].MXS / currSentenceEMag;
        var currSentMNS = isNaN(sentenceMap[currSent].MNS / currSentenceEMag) ? 0 : sentenceMap[currSent].MNS / currSentenceEMag;
        var currSentSMS = isNaN(sentenceMap[currSent].SMS / currSentenceEMag) ? 0 : sentenceMap[currSent].SMS / currSentenceEMag;
       
        
      //  console.log("getFeatureCOS1:  currSentMXS= " + currSentMXS + " currSentMNS= " + currSentMNS + " currSentSMS= "+currSentSMS);
        
         dotProduct = (sentMXS * currSentMXS) +
                     (sentMNS * currSentMNS) +
                     (sentSMS * currSentSMS);
        
        
        sum += dotProduct;
    }
 
    console.log("[[ COS1 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + sum );
    return sum;
}


/* cosine between the conversation preceding the given sentence and the conversation subsequent to the sentence using Sprob as the vector weights */
/* informative sentences might change the conversation in some fashion, leading to a low cosine between the preceding and subsequent portions */
/* NOTE: Requires MXT, MNT and SMT to be set! */
function getFeatureCOS2(sentence){
       
    //1. Get sentence Euclidean magnitudes
    
    var summation = Math.pow(sentence.MXT, 2) + Math.pow(sentence.MNT, 2) + Math.pow(sentence.SMT, 2);
    
    var sentenceEMag = Math.sqrt(summation);
    
    // Handle NaN
    var sentMXT = isNaN(sentence.MXT / sentenceEMag) ? 0 : sentence.MXT / sentenceEMag;
    var sentMNT = isNaN(sentence.MNT / sentenceEMag) ? 0 : sentence.MNT / sentenceEMag;
    var sentSMT = isNaN(sentence.SMT / sentenceEMag) ? 0 : sentence.SMT / sentenceEMag;
   
    var i, sum = 0, dotProduct = 0;
    
    for(currSent in sentenceMap){
        
        if(sentenceMap[currSent].Text == sentence.Text) continue; // only evaluate cosine for before and after
        
        
         // Get the currSentence Euclidean Magnitude
        summation = Math.pow(sentenceMap[currSent].MXT, 2) + Math.pow(sentenceMap[currSent].MNT, 2) + Math.pow(sentenceMap[currSent].SMT, 2);

        var currSentenceEMag = Math.sqrt(summation);

        var currSentMXT = isNaN(sentenceMap[currSent].MXT / currSentenceEMag) ? 0 : sentenceMap[currSent].MXT / currSentenceEMag;
        var currSentMNT = isNaN(sentenceMap[currSent].MNT / currSentenceEMag) ? 0 : sentenceMap[currSent].MNT / currSentenceEMag;
        var currSentSMT = isNaN(sentenceMap[currSent].SMT / currSentenceEMag) ? 0 : sentenceMap[currSent].SMT / currSentenceEMag;
        
        dotProduct = (sentMXT * currSentMXT ) +
                     (sentMNT * currSentMNT ) +
                     (sentSMT * currSentSMT);
        
        sum += dotProduct;
    }
 
    console.log("[[ COS2 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + sum );
  
    return sum;
}


function getBagOfWordStr(sentence){
    
    var text = sentence.Text;

    var tokenizer = new Tokenizer('Chuck');    
     
    var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
    cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

    if(cleanString === undefined || cleanString.length == 0){
        return "";
    }
   
    tokenizer.setEntry(cleanString);

    tokenizer.getSentences(); // must call before get tokens

    return ' ' + tokenizer.getTokens().join(" ") + ' '; 

}

function getSummaryBagOfWordStr(sentence){
    
    var text = sentence.cpText;

    var tokenizer = new Tokenizer('Chuck');    
     
    var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
    cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

    if(cleanString === undefined || cleanString.length == 0){
        return "";
    }
   
    tokenizer.setEntry(cleanString);

    tokenizer.getSentences(); // must call before get tokens

    return ' ' + tokenizer.getTokens().join(" ") + ' '; 

}

function getSprobTermWeights(sentence){
    
    var termWeights = [];
    var testStr;
    
   // 1. populate term weights using Sprob
    var testStr = getBagOfWordStr(sentence);
    
    for(word in sProbMap){ 
        // if word appears in sentence, set the weight, else 0
        if(  testStr.indexOf( ' ' + word + ' ')!== -1  ){ // found match
            termWeights.push(sProbMap[word].cProb);
        }
        else{
            termWeights.push(0);            
        }
        
    }
    
    return termWeights;
    
}

function getTprobTermWeights(sentence){
    
    var termWeights = [];
    var testStr;
    
   // 1. populate term weights using Sprob
    var testStr = getBagOfWordStr(sentence);
    
    for(word in tProbMap){ 
        // if word appears in sentence, set the weight, else 0
        if(  testStr.indexOf( ' ' + word + ' ')!== -1  ){ // found match
            termWeights.push(tProbMap[word].cProb);
        }
        else{
            termWeights.push(0);            
        }
        
    }
    
    return termWeights;
    
}

function getEuclideanNormalizedWeight(vector){
    
    // See - https://nlp.stanford.edu/IR-book/html/htmledition/dot-products-1.html#eqn:normcosine (worked example)
    
    var magnitude, summation = 0, i = 0;
    
    for(i = 0; i<vector.length; i++){
        summation += Math.pow(vector[i],2);
    }
    
    magnitude = Math.sqrt(summation);
    
    for(i = 0; i<vector.length; i++){
        vector[i] = isNaN(vector[i] / magnitude) ? 0 : vector[i] / magnitude;
    }
    
    return vector;
    
}



/* cosine between the conversation preceding the given sentence and the conversation subsequent to the sentence using term weights from Sprob as the vector weights */
/* measure whether the candidate sentence is generally similar to the conversation overall */
function getFeatureCENT1(sentence){
    
    // Normalize vectors by Euclidean magnitude 
    
    console.log("getFeatureCENT1:");
    
    var i, sum = 0, dotProduct = 0;
    var inputSentenceTermWeights;
    var currSentenceTermWeights;
     
   // get term weight for input sentence
    inputSentenceTermWeights = getSprobTermWeights(sentence);
       
    //console.log("inputSentenceTermWeights orig:");
    //console.log(inputSentenceTermWeights);
    
    inputSentenceTermWeights = getEuclideanNormalizedWeight(inputSentenceTermWeights);
    
   // console.log("inputSentenceTermWeights normalized:");
    //console.log(inputSentenceTermWeights);
   
    for(currSentence in sentenceMap){
        
        if(sentenceMap[currSentence].Text == sentence.Text) continue; // calculate dot product for all sentences other than input sentence
        
        // get term weights for all other sentence
        currSentenceTermWeights = getSprobTermWeights(sentenceMap[currSentence]); 
        
        //console.log("currSentenceTermWeights orig:");
        //console.log(currSentenceTermWeights);

        currSentenceTermWeights = getEuclideanNormalizedWeight(currSentenceTermWeights);

        //console.log("currSentenceTermWeights normalized:");

        //console.log(currSentenceTermWeights);
       
        // calculate the dot product
        dotProduct = 0;
        for(i=0; i<currSentenceTermWeights.length; i++){
            dotProduct += (inputSentenceTermWeights[i] * currSentenceTermWeights[i])
        }
        sum += dotProduct;
    }
    
    console.log("[[ CENT1 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + sum);
    return sum;
  
}

/* cosine between the conversation preceding the given sentence and the conversation subsequent to the sentence using term weights from Tprob as the vector weights */
/* measure whether the candidate sentence is generally similar to the conversation overall */
function getFeatureCENT2(sentence){
    
    console.log("getFeatureCENT2:");
    
    var i, sum = 0, dotProduct = 0;
    var inputSentenceTermWeights;
    var currSentenceTermWeights;
     
   // get term weight for input sentence
    inputSentenceTermWeights = getTprobTermWeights(sentence);
    
    inputSentenceTermWeights = getEuclideanNormalizedWeight(inputSentenceTermWeights);
    
    //console.log(inputSentenceTermWeights);
    
   
    for(currSentence in sentenceMap){
        
        if(sentenceMap[currSentence].Text == sentence.Text) continue; // calculate dot product for all sentences other than input sentence
        
        // get term weights for all other sentence
        currSentenceTermWeights = getTprobTermWeights(sentenceMap[currSentence]); 
        
        currSentenceTermWeights = getEuclideanNormalizedWeight(currSentenceTermWeights);
        
       // console.log(currSentenceTermWeights);
       
        // calculate the dot product
        dotProduct = 0;
        for(i=0; i<currSentenceTermWeights.length; i++){
            dotProduct += (inputSentenceTermWeights[i] * currSentenceTermWeights[i])
        }
        sum += dotProduct;
    }
    
    console.log("[[ CENT2 ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + sum);
    return sum;
  
}


/* binary indication current participant initiated the conversation */
/* informative sentences may more often belong to participants who lead the conversation or have a good deal of dominance in the discussion */
/* NOTE: this will be a static feature corresponding to each sentence vector for a given speaker */
function getFeatureBEGAUTH(sentence){
    
    console.log("getFeatureBEGAUTH ");
    var beginConv = 0;
    
    var firstParticipant = sentenceMap['0'].ParticipantName;
    if(sentence.ParticipantName == firstParticipant){
        beginConv = 1;
    }
    
    console.log(" [[ BEGAUTH ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " + beginConv);
    return beginConv;
}


/* max, mean, sum SPOB for a sentence, evaluating all of the words */
/* NOTE: This requires SPROB and TPROB probabilities to have been calculated */
function getMXS_MNS_SMS(sentence){
    
    var i = 0;
    var words = [];
    var cProbs = [];
    
    var res = {
        "mxs" : 0,
        "mns" : 0,
        "sms" : 0
    };
    
    // 1. Get all words in the sentence
    
    var text = sentence.Text;
    
    var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
    cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

    console.log("getMXS_MNS_SMS " + cleanString); 
    
    var tokenizer = new Tokenizer('Chuck');    
    
    if(cleanString === undefined || cleanString.length == 0){ 
        return res;
    }
 
    //console.log(cleanString);

    tokenizer.setEntry(cleanString);

    tokenizer.getSentences(); // must call before get tokens

    words = tokenizer.getTokens(); 
    
    
    // 2. Put the SPROBS for the words in cProbs array
    
    for(i = 0; i<words.length; i++){
        var currWord = words[i];
        cProbs.push(sProbMap[currWord].cProb);
    }
    
     cProbs.sort(sortNumber);
    
    console.log("cProbs ###############");
    console.log(cProbs);
    
    
    // 3. Get max, mean, sum

    var sum = cProbs.reduce(add, 0);
    
    res = {
        "mxs" : cProbs[cProbs.length-1],    // max
        "mns" : sum / cProbs.length,        // mean (avg)
        "sms" : sum                         // sum
    };
    
    console.log("[[ MXS, MNS, SMS]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
    console.log(res);
    
    return res;
}


/* max, mean, sum TPROB for a sentence, evaluating all of the words */
/* NOTE: This requires SPROB and TPROB probabilities to have been calculated */
function getMXT_MNT_SMT(sentence){
    
    var i = 0;
    var words = [];
    var cProbs = [];
    
    var res = {
        "mxt" : 0,
        "mnt" : 0,
        "smt" : 0
    };
    
    // 1. Get all words in the sentence
    
    var text = sentence.Text;
    
    var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
    cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

    console.log("getMXT_MNT_SMT " + cleanString); 
    
    var tokenizer = new Tokenizer('Chuck');    
    
    if(cleanString === undefined || cleanString.length == 0){
        return res;
    }
    
    //console.log(cleanString);

    tokenizer.setEntry(cleanString);

    tokenizer.getSentences(); // must call before get tokens

    words = tokenizer.getTokens(); 
    
    
    // 2. Put the TPROBS for the words in cProbs array
    
    for(i = 0; i<words.length; i++){
        var currWord = words[i];
        
        console.log(currWord);
        console.log(tProbMap[currWord]);
        cProbs.push(tProbMap[currWord].cProb); 
    }
    
     cProbs.sort(sortNumber);
    
    console.log("cProbs ###############");
    console.log(cProbs);
    
    
    // 3. Get max, mean, sum

    var sum = cProbs.reduce(add, 0);
    
    res = {
        "mxt" : cProbs[cProbs.length-1],    // max
        "mnt" : sum / cProbs.length,        // mean (avg)
        "smt" : sum                         // sum
    };
    
    console.log("[[ MXT, MNT, SMT]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
    
    console.log(res);
    
    return res;
    
}


/* for each sentence, remove stopwords and count the number of words that occur in other turns besides the current turn */
/* a measure of conversation cohesion */
function getCWS(sentence){
    
    var cws = 0;
    var wordInOtherTurns = 0;
    var allWordsArr = [];
    var cleanString;
    
    var tokenizer = new Tokenizer('Chuck'); 
 
    // Normalize by total number of words in conversation (sans stop words)
    // 1. Get total number of words in conversation
    for(currSent in sentenceMap){

        if(sentenceMap[currSent].Text === undefined || sentenceMap[currSent].Text.length == 0) continue;

        cleanString = sentenceMap[currSent].Text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
        cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes
                        
        tokenizer.setEntry(cleanString.removeStopWords()); 

        try{
            tokenizer.getSentences(); 
        }
        catch(e){ // above throws exception if clean string is "", so just catch and continue
            continue;
        }

        allWordsArr = allWordsArr.concat(tokenizer.getTokens());            
    }

    var tmpSentenceMap = sentenceMap;
    
    // 1. For each sentence, remove the stop words
    for(currSentence in tmpSentenceMap){
        
        var text = tmpSentenceMap[currSentence].Text;
        
        cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
        cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes
        
        tmpSentenceMap[currSentence].Text = cleanString.removeStopWords();        
    }
    
    //console.log(tmpSentenceMap);
    
    // 2. Count the number of words that occur in other turns
       
    for(currSentence in tmpSentenceMap){ 
        
        var words = [];
        
        if(sentence.TurnID == tmpSentenceMap[currSentence].TurnID) continue; // Look in other turns
        
        if(tmpSentenceMap[currSentence].Text === undefined || tmpSentenceMap[currSentence].Text.length == 0) continue;
        
        tokenizer.setEntry(tmpSentenceMap[currSentence].Text);
        
        tokenizer.getSentences(); // must call before get tokens
          
        words = tokenizer.getTokens(); 
        
        wordInOtherTurns += words.length;
       
    }
    
    console.log("Words in Other turns =" + wordInOtherTurns);
    console.log("All words = " + allWordsArr.length);
    
    cws = wordInOtherTurns / allWordsArr.length;
    
    console.log("[[ CWS ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> = " +cws);
    
    return cws;
    
}
    

/* Caculates the score of the sentence feature vector */
function getScore(sentence){
    
    var score = 0;
    
    // Initial weights per research - Murray and Carenini, 2008 
    
    var featureWeights;
    
    if(MESSAGE_FORMAT == 'long') // (Email) Weights, best suited for long, passage content. 
    {
        // Email
        featureWeights = {
                "SLEN" :  0.085,
                "SLEN2" : 0.06,
                "TLOC" : 0.03,
                "CLOC" : 0.014,
                "TPOS1" : 0.001,
                "TPOS2" : 0.005,
                "SPAU" : 0.003333333333333,
                "PPAU" : 0.000000000000001,
                "DOM" : 0.001,
                "BEGAUTH" : 0.006666666666667,
                "MXS" : 0.035,
                "MNS" : 0.002,
                "SMS" : 0.055,
                "MXT" : 0.033333333333333,
                "MNT" : 0.004,
                "SMT" : 0.05,
                "COS1" : 0.005,
                "COS2" : 0.004,
                "CENT1" : 0.053333333333333,
                "CENT2" : 0.055,
                "CWS" : 0.08        
            };
    }
    else {
        // Short (Chat) Well suited for short-form messaging like chat messages
        featureWeights = {
            "SLEN" :  0.216666666666667,
            "SLEN2" : 0.000000000000001,
            "TLOC" : 0.0375,
            "CLOC" : 0.005,
            "TPOS1" : 0.005,
            "TPOS2" : 0.005,
            "SPAU" : 0.005,
            "PPAU" : 0.000000000000001,
            "DOM" : 0.000000000000001,
            "BEGAUTH" : 0.000000000000001,
            "MXS" : 0.07,
            "MNS" : 0.000000000000001,
            "SMS" : 0.175,
            "MXT" : 0.1,
            "MNT" : 0.05,
            "SMT" : 0.175,
            "COS1" : 0.000000000000001,
            "COS2" : 0.000000000000001,
            "CENT1" : 0.175,
            "CENT2" : 0.15,
            "CWS" : 0.18        
        };
            
    }

    // Score is the dot product of the sentence feature vector and the feature weights 
    
    score = (sentence.SLEN * featureWeights.SLEN) +
            (sentence.SLEN2 * featureWeights.SLEN2) +    
            (sentence.TLOC * featureWeights.TLOC) +
            (sentence.CLOC * featureWeights.CLOC) +        
            (sentence.TPOS1 * featureWeights.TPOS1) +        
            (sentence.TPOS2 * featureWeights.TPOS2) +        
            (sentence.SPAU * featureWeights.SPAU) +        
            (sentence.PPAU * featureWeights.PPAU) +        
            (sentence.DOM * featureWeights.DOM) +        
            (sentence.BEGAUTH * featureWeights.BEGAUTH) +        
            (sentence.MXS * featureWeights.MXS) +        
            (sentence.MNS * featureWeights.MNS) +        
            (sentence.SMS * featureWeights.SMS) +        
            (sentence.MXT * featureWeights.MXT) +        
            (sentence.MNT * featureWeights.MNT) +        
            (sentence.SMT * featureWeights.SMT) +        
            (sentence.COS1 * featureWeights.COS1) +        
            (sentence.COS2 * featureWeights.COS2) +
            (sentence.CENT1 * featureWeights.CENT1) +        
            (sentence.CENT2 * featureWeights.CENT2) +        
            (sentence.CWS * featureWeights.CWS);        
           
    console.log("score = "+score);    
    return score;
}
    
// Maps value between 0 and 1
function getLogisticRegression(score){
  
    /* logistic regression = 1 / (1 + e^-score) */
    
    var logistR =  1 / (1 + Math.exp(-1 * score) );
    
    
    return logistR;
}

function sigmoid(x) {
    /*
        Logistic sigmoid function
    */
    return 1.0 / (1.0 + Math.exp(-x));

};


function initSprobMap(){
    
    console.log("initSprobMap");
        
    sProbMap = {};
    
    var i = 0;
    var words = [];
    var counts = {};
    
    var tokenizer = new Tokenizer('Chuck'); 
    
    
    //
    // Setup the sProbMap with unique words and frequencies
    //
    
    
    // A. Clean up the sentence strings, and get the words (including dups)
    for(sentence in sentenceMap){
                
        var text = sentenceMap[sentence].Text;
        
        var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
        cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes
       
        if(cleanString === undefined || cleanString.length == 0) continue;
        
        //console.log(cleanString);
        
        tokenizer.setEntry(cleanString);

        tokenizer.getSentences(); // must call before get tokens
                      
        words = words.concat(tokenizer.getTokens()); 
    }
       
    //console.log("WORDS ----" + words.length);
    // console.log(words);
    
    
    // B. Get the unique words and frequencies of occurrence

    for(i = 0; i< words.length; i++) {
        var word = words[i];
        counts[word] = counts[word] ? counts[word]+1 : 1;
        //console.log("counts[word] = " + counts[word]);
    }
   
    //console.log("counts ----");   
    //console.log(counts); 
    
    
    // C. Init sProbMap based on the unique words and frequencies
    
    var uniqueWords = Object.keys(counts);
    
    //console.log("uniqueWords ----"); 
    //console.log(uniqueWords);
    
    for(i = 0; i < uniqueWords.length; i++){
        
        var uWord = uniqueWords[i];
        
        var entry = {
            cProb : 0,
            freqInConvo : counts[uWord]
        };
        
        sProbMap[uWord] = entry;
    }
  
    //console.log(" ");    
    //console.log("[[ SPROB INIT ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    //console.log(sProbMap);
    //console.log(" ");    
        
}


function setSprobMapProbabilities(){
    
    var i = 0;
    var wordsArr = [];
    var cProbs = [];
    
    var tokenizer = new Tokenizer('Chuck'); 

    for(word in sProbMap){
        
        cProbs = [];
        
        var freqInConvo = sProbMap[word].freqInConvo;
        
        // For each participant, get the number of times the word was used over the conversation
        for(i = 0; i<participantArr.length; i++){
            
            wordsArr = [];
            
            var currParticipant = participantArr[i];
            
            // A. create a long concatenated string of everything the participant said
            
            for(sentence in sentenceMap){
                
                if(sentenceMap[sentence].ParticipantName !== currParticipant) continue; // skip this sentence, cuz not the right participant

                var text = sentenceMap[sentence].Text;

                var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
                cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

                if(cleanString === undefined || cleanString.length == 0) continue;
                
                //console.log(cleanString);

                tokenizer.setEntry(cleanString);

                tokenizer.getSentences(); // must call before get tokens

                wordsArr = wordsArr.concat(tokenizer.getTokens()); 
                
            } // end sentence for
            
            var participantWords = wordsArr.join(" "); // create a big string containing the participant's words
            participantWords = " " + participantWords + " ";  // simple fix allows us to look for whole words, format ' word '
            
            var freqInConvoByParticipant = occurrences(participantWords, ' ' + word + ' ');  
            
            //console.log("participant: " + currParticipant + " word: " + word + " frequency: " + freqInConvoByParticipant );
            
            var prob = freqInConvoByParticipant / freqInConvo;
            
            cProbs.push(prob);
            
        } // end participant For
        
        
        // We have the conditional probabilities for the word for every participant, now pick the max one.
       // console.log("Conditional probabilities for word - " + word);
        
        cProbs.sort(sortNumber);

        //console.log(cProbs);
        
        // Finally update the sProbs with max probability across the participants
        sProbMap[word].cProb = cProbs[cProbs.length-1];
        
    } // end word for

    console.log(" ");    
    console.log("[[ SPROB ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(sProbMap);
    console.log(" ");     
}


function initTprobMap(){
    
    console.log("initTprobMap");
        
    tProbMap = {};
    
    var i = 0;
    var words = [];
    var counts = {};
    
    var tokenizer = new Tokenizer('Chuck'); 
    
    
    //
    // Setup the sProbMap with unique words and frequencies
    //
    
    
    // A. Clean up the sentence strings, and get the words (including dups)
    for(sentence in sentenceMap){
                
        var text = sentenceMap[sentence].Text;
        
        var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
        cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes
       
        if(cleanString === undefined || cleanString.length == 0) continue;
       
        //console.log(cleanString);

        tokenizer.setEntry(cleanString);

        tokenizer.getSentences(); // must call before get tokens
                      
        words = words.concat(tokenizer.getTokens()); 
    }
       
    //console.log("WORDS ----" + words.length);
    //console.log(words);
    
    
    // B. Get the unique words and frequencies of occurrence

    for(i = 0; i< words.length; i++) {
        var word = words[i];
        counts[word] = counts[word] ? counts[word]+1 : 1;
        //console.log("counts[word] = " + counts[word]);
    }
   
    //console.log("counts ----");   
    //console.log(counts); 
    
    
    // C. Init sProbMap based on the unique words and frequencies
    
    var uniqueWords = Object.keys(counts);
    
    //console.log("uniqueWords ----"); 
    //console.log(uniqueWords);
    
    for(i = 0; i < uniqueWords.length; i++){
        
        var uWord = uniqueWords[i];
        
        var entry = {
            cProb : 0,
            freqInTurns : counts[uWord]
        };
        
        tProbMap[uWord] = entry;
    }
  
    //console.log(" ");
    //console.log("[[ TPROB INIT ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    //console.log(tProbMap);  
    //console.log(" ");    
        
}


function setTprobMapProbabilities(){
    
    var i = 0;
    var wordsArr = [];
    var cProbs = [];
    
    var tokenizer = new Tokenizer('Chuck'); 

    for(word in tProbMap){
        
        cProbs = [];
        
        var freqInTurns = tProbMap[word].freqInTurns;
        
        // For each turn, get the number of times the word was used over the conversation
        for(turn in turnsMap){
            
            wordsArr = [];
                        
            // A. create a long concatenated string of everything the participant said
            
            for(sentence in sentenceMap){
                
                if(sentenceMap[sentence].TurnID !== turn) continue; // skip this sentence, cuz not the right turn

                var text = sentenceMap[sentence].Text;

                var cleanString = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""); // general cleanup
                cleanString = cleanString.replace(/['"]+/g, ' '); // remove double quotes

                if(cleanString === undefined || cleanString.length == 0) continue;
               
                //console.log(cleanString);

                tokenizer.setEntry(cleanString);

                tokenizer.getSentences(); // must call before get tokens

                wordsArr = wordsArr.concat(tokenizer.getTokens()); 
                
            } // end sentence for
            
            var turnWords = wordsArr.join(" "); // create a big string containing the participant's words
            turnWords = " " + turnWords + " ";  // simple fix allows us to look for whole words, format ' word '
            
            var freqInConvoByTurn = occurrences(turnWords, ' ' + word + ' ');  
            
            //console.log("turn: " + turn + " word: " + word + " frequency: " + freqInConvoByTurn );
            
            var prob = freqInConvoByTurn / freqInTurns;
            
            cProbs.push(prob);
            
        } // end participant For
        
        
        // We have the conditional probabilities for the word for every participant, now pick the max one.
        //console.log("Conditional probabilities for word - " + word);
        
        cProbs.sort(sortNumber);

        console.log(cProbs);
        
        // Finally update the sProbs with max probability across the participants
        tProbMap[word].cProb = cProbs[cProbs.length-1];
        
    } // end word for

    console.log(" ");
    console.log("[[ TPROB ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(tProbMap);
    console.log(" ");    
}


function initTurnsMap(conversation){
    
    turnsMap = {}; 
    
    var turns = "";
    var savedParticipant = "";
    var turnCnt = 0;
    var msgsInTurn = [];
        
    for (messageID in conversation) {
        var message = conversation[messageID];
        var currParticipant = message.ParticipantName;
        if(currParticipant !== undefined) // prevent undefined messages
        {
            //console.log(currParticipant);
            if(currParticipant !== savedParticipant){ // Current participant isn't the last participant
                // add new entry to turnsMap
                turnCnt++;
                msgsInTurn = [];
                msgsInTurn.push(message);
                turnsMap[turnCnt] = msgsInTurn;
            }
            else{ // Current participant in this message is same as last participant

                msgsInTurn.push(message);
                turnsMap[turnCnt] = msgsInTurn;                 
            }    
        }
        savedParticipant = currParticipant;
    }   
    
    console.log("  ");    
    console.log("[[ TURNS ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(turnsMap);
    console.log("  ");
    
}


function initParticipantsArr(){
  
     participantArr = [];  

     for(turn in turnsMap){
         var participant = turnsMap[turn][0].ParticipantName; // First message of the participant's turn
         participantArr.indexOf(participant) === -1 ? participantArr.push(participant) : console.log("This participant already exists in map. Skipping.");
     }
    console.log("  ");     
    console.log("[[ PARTICIPANTS ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(participantArr);
    console.log("  ");     
}



function initSentencesMap(){
    
    sentenceMap = {};
    
    var i,j = 0;
    var sentences = [];
    var messagesArr = null;
    
    var tokenizer = new Tokenizer('Chuck');
    
    // Step 1. Get all sentences in an array
    
    //Add to sentences structure for each turn
    for(turn in turnsMap){
        
        var messagesArr = turnsMap[turn]; // get all sentences, in all messages for this turn
        for(j = 0; j < messagesArr.length; j++)
        {
            tokenizer.setEntry(messagesArr[j].Message);

            sentences = sentences.concat(tokenizer.getSentences());
        }  
        
    }
   
    console.log("  ");    
    console.log("[[ SENTENCES ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> (" + sentences.length + ")");
    console.log(sentences);
    console.log("  ");    
    
    // Step 2. Create the sentenceMap structure
    
    for(i = 0; i< sentences.length; i++){
        
        var currSentence = sentences[i];
        
        for(turn in turnsMap){
            
            messagesArr = turnsMap[turn]; // get all messages for this turn   
            
            var found = false;
            for(j = 0; j < messagesArr.length; j++)
            {
                var currMessage = messagesArr[j].Message;
                    
                // remove unnecessary whitespace in the message using Regex
                var currMessageFormat1 = currMessage.trim().replace(/\s{2,}/g, ' ');
                
                // remove unnecessary whitespace a second way (for cases when Regex fails)
                tokenizer.setEntry(currMessage.trim());
                tokenizer.getSentences(); 
                var currMessageFormat2 = tokenizer.getTokens().join(" "); 
                              
                if(currMessageFormat1.indexOf(currSentence) !== -1 ||
                   currMessageFormat2.indexOf(currSentence) !== -1 ||
                   currMessage.localeCompare(currSentence) == 0 ) // we found a match            
                {
                    var sentenceObj = {
                        "Text" : currSentence, // Will be manipulated by alg, so save version in cpText
                        "cpText" : currSentence,
                        "ParticipantName" : messagesArr[j].ParticipantName, 
                        "TimeStamp" : messagesArr[j].TimeStamp,
                        "TurnID" : turn, 
                        "PositionInTurn" : j,  
                        "PositionInConvo" : i, 
                        "MessageId" : messagesArr[j].MessageId,
                        "Length" : currSentence.length,
                        "SLEN" : -1,
                        "SLEN2" : -1,
                        "TLOC" : -1,
                        "CLOC" : -1,
                        "TPOS1" : -1,
                        "TPOS2" : -1,
                        "SPAU" : -1,
                        "PPAU" : -1,
                        "DOM" : -1,
                        "BEGAUTH" : -1,
                        "MXS" : -1,
                        "MNS" : -1,
                        "SMS" : -1,
                        "MXT" : -1,
                        "MNT" : -1,
                        "SMT" : -1,
                        "COS1" : -1,
                        "COS2" : -1,
                        "CENT1" : -1,
                        "CENT2" : -1,
                        "CWS" : -1,
                        "SCORE" : -1,
                        "LOGR" : -1,
                        "ESSEN" : false   
                    };
                    
                    sentenceMap[i] = sentenceObj;
                    found = true;
                    break; 
                }

            }
            if(found) break; 
        }
         
    }
        
    //console.log("SENTENCES - MAP###############  ");
    //console.log(sentenceMap);
        
 }


function setSentenceFeatures(){
    
    for(sentence in sentenceMap){
        
        
        sentenceMap[sentence].SLEN      = getFeatureSLEN(sentenceMap[sentence]);
        sentenceMap[sentence].SLEN2     = getFeatureSLEN2(sentenceMap[sentence]);
        sentenceMap[sentence].TLOC      = getFeatureTLOC(sentenceMap[sentence]);
        sentenceMap[sentence].CLOC      = getFeatureCLOC(sentenceMap[sentence]);
        sentenceMap[sentence].TPOS1     = getFeatureTPOS1(sentenceMap[sentence]);
        sentenceMap[sentence].TPOS2     = getFeatureTPOS2(sentenceMap[sentence]);
        sentenceMap[sentence].SPAU      = getFeatureSPAU(sentenceMap[sentence]);
        sentenceMap[sentence].PPAU      = getFeaturePPAU(sentenceMap[sentence]);
        sentenceMap[sentence].DOM       = getFeatureDOM(sentenceMap[sentence]);
        sentenceMap[sentence].BEGAUTH   = getFeatureBEGAUTH(sentenceMap[sentence]);
        
        var mxs_mns_sms                 = getMXS_MNS_SMS(sentenceMap[sentence]);
        sentenceMap[sentence].MXS       = mxs_mns_sms.mxs; 
        sentenceMap[sentence].MNS       = mxs_mns_sms.mns;
        sentenceMap[sentence].SMS       = mxs_mns_sms.sms;
        
        var mxt_mnt_smt                 = getMXT_MNT_SMT(sentenceMap[sentence]);
        sentenceMap[sentence].MXT       = mxt_mnt_smt.mxt;
        sentenceMap[sentence].MNT       = mxt_mnt_smt.mnt;
        sentenceMap[sentence].SMT       = mxt_mnt_smt.smt;
        
        sentenceMap[sentence].COS1      = getFeatureCOS1(sentenceMap[sentence]); // Must follow getMXS_MNS_SMS
        sentenceMap[sentence].COS2      = getFeatureCOS2(sentenceMap[sentence]); // Must follow getMXT_MNT_SMT
        sentenceMap[sentence].CENT1     = getFeatureCENT1(sentenceMap[sentence]);
        sentenceMap[sentence].CENT2     = getFeatureCENT2(sentenceMap[sentence]);
        sentenceMap[sentence].CWS       = getCWS(sentenceMap[sentence]);        
        
        // Scoring
        sentenceMap[sentence].SCORE     = getScore(sentenceMap[sentence]);
        sentenceMap[sentence].LOGR      = sigmoid(sentenceMap[sentence].SCORE); 
        
        // Classification
        sentenceMap[sentence].ESSEN     = getClassification(sentenceMap[sentence].LOGR);
        
    }
    
    // Log out entire feature vector
    console.log(" ");
    console.log("[[ SENTENCE FEATURE VECTORS ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(sentenceMap);
    console.log(" ");    
   
}

function getClassification(logrScore){
    
    if(logrScore >= STATISTICAL_CLASSIFY_THRESHOLD)
        return true;
    else
        return false;
}
    
    
function showClassifications(){
    
    console.log(" ");
    console.log("[[ ALGORITHM CLASSIFICATIONS ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(" ");    
    for(sentence in sentenceMap){
        
        var out = {
            "text" : sentenceMap[sentence].Text,
            "LOGR" : sentenceMap[sentence].LOGR,
            "include" : sentenceMap[sentence].ESSEN
        }
        console.log(out);
    }
    
}

function getSummary(){

    console.log(" ");    
    console.log("###################### THE GOODS ####################");
    console.log(" ");
    console.log(" ");
    console.log("[[ ORIGINAL TEXT]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ");
    console.log(" ");
    for(sentence in sentenceMap){  
            console.log("[ " + sentenceMap[sentence].ParticipantName + " ] " + sentenceMap[sentence].cpText);
    }
    
    /*var participant = '';
    var message = '';
    
    console.log(" ");     
    console.log("SUMMARY: ");
    console.log(" ");    
    for(sentence in sentenceMap){
                  
        if(sentenceMap[sentence].ESSEN === true){
            console.log(sentenceMap[sentence].ParticipantName);
            console.log(sentenceMap[sentence].cpText);    
        }
    }
    */
    
    console.log(" ");     
    console.log("[[ SUMMARY TEXT ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ");
    
    var savedParticipant = "";
    var participant = "";
    var outmsg = "";
    
    var entry = {
       "ParticipantName" : "",
       "Summarized_Message" : ""
    };
         
    
    summaryArr = [];

    // Get the summarization stats
    var sentCnt = 0;
    var essenSentCnt = 0;
    var originalWordCnt = 0;
    var summarizedWordCnt = 0;
    for(s in sentenceMap){
        if(sentenceMap[s].ESSEN === true){
            //summarizedWordCnt += (getBagOfWordStr(sentenceMap[s])).length;
            
            summarizedWordCnt += wordCounter(getSummaryBagOfWordStr(sentenceMap[s])); 
            essenSentCnt++;
        }
        
        // original content counts
        //originalWordCnt += (getBagOfWordStr(sentenceMap[s])).length;
        originalWordCnt += wordCounter(getSummaryBagOfWordStr(sentenceMap[s])); 
        sentCnt++;
    }
    
    var statsEntry = {
        "ConvoStartTimeStamp": sentenceMap['0'].TimeStamp,
        "ConvoEndTimeStamp": sentenceMap[sentCnt-1].TimeStamp,
        "ConvoWordCnt": originalWordCnt,
        "CC_SummaryWordCnt": summarizedWordCnt         
    };  
    
    // End Stats
   
    summaryArr.push(statsEntry); 
    
    for (sentence in sentenceMap) {
        if(sentenceMap[sentence].ESSEN === true) // include only essential sentences
        {

            var participant = sentenceMap[sentence].ParticipantName;           
            var message = sentenceMap[sentence].cpText;
            
            if(participant !== "" && participant !== savedParticipant){
                               
                if(savedParticipant !== ""){
                    
                   entry = {
                        "ParticipantName" : savedParticipant,
                        "Summarized_Message" : outmsg
                    };
                   
                    summaryArr.push(entry);
                }
                    
                console.log(savedParticipant);
                console.log(outmsg);                
                outmsg = "";
            }
            
            if(!endsWithPunctuation(message)){ // if sentence doesn't end with punctuation, add it
                message += ".";
            }                  

            outmsg += " " + message;
            
            savedParticipant = participant;
        }
    } 
    console.log(savedParticipant);
    console.log(outmsg);
    
   entry = {
        "ParticipantName" : savedParticipant,
        "Summarized_Message" : outmsg
    };
    
    
    summaryArr.push(entry);
    
    console.log(" ");   
    console.log("[[ SUMMARY ARRAY ]] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(" ");    
    console.log(summaryArr);
    console.log(" ");
    
    return summaryArr;
    
}

// ------------------------- UTILITIES --------------------------------//

// Used to sort JSON
function predicatBy(prop){
   return function(a,b){
      if( a[prop] > b[prop]){
          return 1;
      }else if( a[prop] < b[prop] ){
          return -1;
      }
      return 0;
   }
}


// Used for numeric array sort
function sortNumber(a,b) {
    return a - b;
}


// Used for efficient array summation
function add(a, b) {
    return a + b;
}

function endsWithPunctuation(str){

    //var result = !!str.match(/^[.,:!?]/);
    var result = !!str.match(/[.,:!?]$/);    
    return result;
}

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
function occurrences(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

/*
 * String method to remove stop words
 * Written by GeekLad http://geeklad.com
 * Stop words obtained from http://www.lextek.com/manuals/onix/stopwords1.html
 *   Usage: string_variable.removeStopWords();
 *   Output: The original String with stop words removed
 */
String.prototype.removeStopWords = function() {
    var x;
    var y;
    var word;
    var stop_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var stop_words = new Array(
        'a',
        'about',
        'above',
        'across',
        'after',
        'again',
        'against',
        'all',
        'almost',
        'alone',
        'along',
        'already',
        'also',
        'although',
        'always',
        'among',
        'an',
        'and',
        'another',
        'any',
        'anybody',
        'anyone',
        'anything',
        'anywhere',
        'are',
        'area',
        'areas',
        'around',
        'as',
        'ask',
        'asked',
        'asking',
        'asks',
        'at',
        'away',
        'b',
        'back',
        'backed',
        'backing',
        'backs',
        'be',
        'became',
        'because',
        'become',
        'becomes',
        'been',
        'before',
        'began',
        'behind',
        'being',
        'beings',
        'best',
        'better',
        'between',
        'big',
        'both',
        'but',
        'by',
        'c',
        'came',
        'can',
        'cannot',
        'case',
        'cases',
        'certain',
        'certainly',
        'clear',
        'clearly',
        'come',
        'could',
        'd',
        'did',
        'differ',
        'different',
        'differently',
        'do',
        'does',
        'done',
        'down',
        'down',
        'downed',
        'downing',
        'downs',
        'during',
        'e',
        'each',
        'early',
        'either',
        'end',
        'ended',
        'ending',
        'ends',
        'enough',
        'even',
        'evenly',
        'ever',
        'every',
        'everybody',
        'everyone',
        'everything',
        'everywhere',
        'f',
        'face',
        'faces',
        'fact',
        'facts',
        'far',
        'felt',
        'few',
        'find',
        'finds',
        'first',
        'for',
        'four',
        'from',
        'full',
        'fully',
        'further',
        'furthered',
        'furthering',
        'furthers',
        'g',
        'gave',
        'general',
        'generally',
        'get',
        'gets',
        'give',
        'given',
        'gives',
        'go',
        'going',
        'good',
        'goods',
        'got',
        'great',
        'greater',
        'greatest',
        'group',
        'grouped',
        'grouping',
        'groups',
        'h',
        'had',
        'has',
        'have',
        'having',
        'he',
        'her',
        'here',
        'herself',
        'high',
        'high',
        'high',
        'higher',
        'highest',
        'him',
        'himself',
        'his',
        'how',
        'however',
        'i',
        'if',
        'important',
        'in',
        'interest',
        'interested',
        'interesting',
        'interests',
        'into',
        'is',
        'it',
        'its',
        'itself',
        'j',
        'just',
        'k',
        'keep',
        'keeps',
        'kind',
        'knew',
        'know',
        'known',
        'knows',
        'l',
        'large',
        'largely',
        'last',
        'later',
        'latest',
        'least',
        'less',
        'let',
        'lets',
        'like',
        'likely',
        'long',
        'longer',
        'longest',
        'm',
        'made',
        'make',
        'making',
        'man',
        'many',
        'may',
        'me',
        'member',
        'members',
        'men',
        'might',
        'more',
        'most',
        'mostly',
        'mr',
        'mrs',
        'much',
        'must',
        'my',
        'myself',
        'n',
        'necessary',
        'need',
        'needed',
        'needing',
        'needs',
        'never',
        'new',
        'new',
        'newer',
        'newest',
        'next',
        'no',
        'nobody',
        'non',
        'noone',
        'not',
        'nothing',
        'now',
        'nowhere',
        'number',
        'numbers',
        'o',
        'of',
        'off',
        'often',
        'old',
        'older',
        'oldest',
        'on',
        'once',
        'one',
        'only',
        'open',
        'opened',
        'opening',
        'opens',
        'or',
        'order',
        'ordered',
        'ordering',
        'orders',
        'other',
        'others',
        'our',
        'out',
        'over',
        'p',
        'part',
        'parted',
        'parting',
        'parts',
        'per',
        'perhaps',
        'place',
        'places',
        'point',
        'pointed',
        'pointing',
        'points',
        'possible',
        'present',
        'presented',
        'presenting',
        'presents',
        'problem',
        'problems',
        'put',
        'puts',
        'q',
        'quite',
        'r',
        'rather',
        'really',
        'right',
        'room',
        'rooms',
        's',
        'said',
        'same',
        'saw',
        'say',
        'says',
        'second',
        'seconds',
        'see',
        'seem',
        'seemed',
        'seeming',
        'seems',
        'sees',
        'several',
        'shall',
        'she',
        'should',
        'show',
        'showed',
        'showing',
        'shows',
        'side',
        'sides',
        'since',
        'small',
        'smaller',
        'smallest',
        'so',
        'some',
        'somebody',
        'someone',
        'something',
        'somewhere',
        'state',
        'states',
        'still',
        'still',
        'such',
        'sure',
        't',
        'take',
        'taken',
        'than',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'therefore',
        'these',
        'they',
        'thing',
        'things',
        'think',
        'thinks',
        'this',
        'those',
        'though',
        'thought',
        'thoughts',
        'three',
        'through',
        'thus',
        'to',
        'today',
        'together',
        'too',
        'took',
        'toward',
        'turn',
        'turned',
        'turning',
        'turns',
        'two',
        'u',
        'under',
        'until',
        'up',
        'upon',
        'us',
        'use',
        'used',
        'uses',
        'v',
        'very',
        'w',
        'want',
        'wanted',
        'wanting',
        'wants',
        'was',
        'way',
        'ways',
        'we',
        'well',
        'wells',
        'went',
        'were',
        'what',
        'when',
        'where',
        'whether',
        'which',
        'while',
        'who',
        'whole',
        'whose',
        'why',
        'will',
        'with',
        'within',
        'without',
        'work',
        'worked',
        'working',
        'works',
        'would',
        'x',
        'y',
        'year',
        'years',
        'yet',
        'you',
        'young',
        'younger',
        'youngest',
        'your',
        'yours',
        'z'
    )
            
    if(cleansed_string === undefined || cleansed_string.length == 0){
        return "";
    }

    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)
 
    // Review all the words
    for(x=0; x < words.length; x++) {
        // For each word, check all the stop words
        for(y=0; y < stop_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "");   // Trim the word and remove non-alpha
             
            // Get the stop word
            stop_word = stop_words[y];
             
            // If the word matches the stop word, remove it from the keywords
            if(word.toLowerCase() == stop_word) {
                // Build the regex
                regex_str = "^\\s*"+stop_word+"\\s*$";      // Only word
                regex_str += "|^\\s*"+stop_word+"\\s+";     // First word
                regex_str += "|\\s+"+stop_word+"\\s*$";     // Last word
                regex_str += "|\\s+"+stop_word+"\\s+";      // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");
             
                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
        
    // Safely return empty string if no alphanumerics found

    if(cleansed_string.replace(/[^A-Z]/gi, "").length == 0) return ""; 
    
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}
    
// ------------------------- END UTILITIES --------------------------------//

exports.getMomentSummary = function(conversation, threshold, format) {
        
     STATISTICAL_CLASSIFY_THRESHOLD = threshold;
     
     MESSAGE_FORMAT = format;
    
    /*
        1. Normalize TLOC by number of sentences in the turn
        2. Normalize CLOC by number of sentences in the convo 
        
        3. Normalized TPOS1 and TPOS2 by length of the conversation
        4. Normalized DOM by total number of words in conversation
   
   
        5. Euclidean Normal COS1, COS2, CENT1, CENT2 - See - https://nlp.stanford.edu/IR-book/html/htmledition/dot-products-1.html#eqn:normcosine
        worked example
        
        6. CWS Normalize by total number of words in convo
    
    
    */
    
    
    // required initialization must follow this exact order
    initTurnsMap(conversation);
    initParticipantsArr();
    initSentencesMap();
    
    /* Alg: SPROB 
    For each unique word
        Count frequency of word
        For each participant
            Count times participant used the word
            Calculate the probability for the word
        End For
        Pick max probability for the word
        Assign to SPROB
    */
    initSprobMap();
    setSprobMapProbabilities();
    
    
    /* Alg: TPROB 
    For each unique word
        Count frequency of word
        For each turn
            Count times turn used the word
            Calculate the probability for the word
        End For
        Pick max probability for the word
        Assign to TPROB
    */   
    initTprobMap();
    setTprobMapProbabilities();   
    
    // The Goods - set the sentence features
     setSentenceFeatures();
    
    showClassifications();
    
    //getFeatureSLEN(sentenceMap['2']);
    //getFeatureSLEN2(sentenceMap['2']);
    //getFeatureTLOC(sentenceMap['2']);
    //getFeatureCLOC(sentenceMap['2']);
    //getFeatureTPOS1(sentenceMap['2']);
    //getFeatureTPOS2(sentenceMap['2']);   
    //getFeatureSPAU(sentenceMap['2']); 
    //getFeaturePPAU(sentenceMap['2']); 
    //getFeatureDOM(sentenceMap['2']);
    //getFeatureBEGAUTH(sentenceMap['2']);    
    //getMXS_MNS_SMS(sentenceMap['2']); 
    //getMXT_MNT_SMT(sentenceMap['2']);
    //getFeatureCOS1(sentenceMap['2']);  // must call setSentenceFeatures() first
    //getFeatureCOS2(sentenceMap['2']);  // must call setSentenceFeatures() first
    //getFeatureCENT1(sentenceMap['2']);
    //getFeatureCENT2(sentenceMap['2']);
    //getCWS(sentenceMap['2']);
    
    
    return getSummary();
    
};


