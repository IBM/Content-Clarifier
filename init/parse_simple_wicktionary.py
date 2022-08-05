import sys
#import pymongo
import xml.etree.ElementTree as ET
import json
#import wikitextparser as wtp
import re

nsmap = {}
ns=0
#parser = ET.XMLPullParser(['start', 'end'])
#parser.feed('C:\python_code\enwiktionary-latest-pages-articles.xml')
#list(parser.read_events())

#print (event + root)
pointer=0
setCounter =-1
th_list =[]
f = open('words.json', 'w')
orig_stdout = sys.stdout
sys.stdout = f
source_full = 'C:\python_code\enwiktionary-latest-pages-articles.xml'
source_simple = 'simplewiktionary-latest-pages-articles.xml'
WORDS_JSON = [];
for event, elem in ET.iterparse(source_simple):
  ns=ns+1
  s = str(elem.tag)
  if event == 'end' and s.find('page')!=-1 :
		 #tempWord["Word"]=title
		 #pageList = elem.getchildren()
		 #print(pageList[3])
		 title = elem.findtext('{http://www.mediawiki.org/xml/export-0.10/}title')
		 tempWord = {"Word":"","TYPE":[], "NOUN":{"DEFINITIONS":[]}, "VERB":{"DEFINITIONS":[]}, "ADVERB":{"DEFINITIONS":[]}, "ADJECTIVE":{"DEFINITIONS":[]}}
		 if ":"  not in title:
			 tempWord["Word"]=title
			 id= int(elem.findtext('{http://www.mediawiki.org/xml/export-0.10/}id'))
			 #print('\n')
			 revision =  elem.find('{http://www.mediawiki.org/xml/export-0.10/}revision')
			 verb_List = revision.findtext('{http://www.mediawiki.org/xml/export-0.10/}text').split('\n')
			 myText = 	revision.findtext('{http://www.mediawiki.org/xml/export-0.10/}text').replace('\n',' ')
			 utfText = myText.encode(encoding='UTF-8',errors='strict')
			 #print(utfText)
			 #test_pro = re.match(".*{{IPA\|/(?P<Pronunciation_TEST>.*)/\|lang=en}}.*", "* {{IPA|/fÉ¹iË/|lang=en}}\n")
			 #if test_pro is not None:
					#print(str(test_pro.groupdict()).encode(encoding='UTF-8',errors='strict'))
			 m = re.match(".*{{IPA\|/(?P<Pronunciation>.*)/}}", myText)
			 
			 noun_def = []
			 noun_id =0
			 verb_id=0
			 adverb_id =0
			 adjective_id=0
			 isNoun =0
			 isVerb =0
			 isAdverb =0
			 isAdjective =0
			 #if m is not None:
					#print(str(m.groupdict()).encode(encoding='UTF-8',errors='strict'))
					#tempWord["PRONUNCIATION"]=m.group(1)
			 for ver in verb_List:
				
					if ver == "==Noun==" or  ver =="== Noun ==" or  ver =="== Proper noun ==" or  ver =="==Proper noun==":
							isNoun=1
							isVerb =0
							isAdverb =0
							isAdjective =0
					if ver == "==Verb=="or ver == "== Verb ==":
							isNoun=0
							isVerb =1
							isAdverb =0
							isAdjective =0
					if ver == "==Adjective=="or ver =="== Adjective ==":
							isNoun=0
							isVerb =0
							isAdverb =0
							isAdjective =1
					if ver == "==Adverb=="or ver =="== Adverb ==":
							isNoun=0
							isVerb =0
							isAdverb =1
							isAdjective =0
					regexp_Redirect = re.search("{{(.*) of\|(.*)}}", ver)
					if regexp_Redirect is not None:
							#print(regexp_Redirect.group(1) + " REDIRECT")
							tempWord["USAGE"]=regexp_Redirect.group(1)
							tempWord["ROOT"]=regexp_Redirect.group(2)
							break
					regexp_trans = re.search(".*{{transitive}}(.*)$", ver)
					regexp_ti_verb = re.search(".*{{ti verb}}(.*)$", ver)
					regexp_intrans = re.search(".*{{transitive verb}}(.*)$", ver)
					regexp_definitions = re.search(".*#(.*)$", ver)
					if regexp_definitions is not None:
							if not regexp_definitions.group(1).startswith(':') and not regexp_definitions.group(1).startswith('*'):
								if isNoun == 1:
								 if "NOUN" not in tempWord["TYPE"]:
								  tempWord["TYPE"].append("NOUN")
								 tempWord["NOUN"]["DEFINITIONS"].append({"id":noun_id,"text":regexp_definitions.group(1)})
								 noun_id = noun_id+1
								if isAdverb == 1:
								 if "ADVERB" not in tempWord["TYPE"]:
								  tempWord["TYPE"].append("ADVERB")
								 tempWord["ADVERB"]["DEFINITIONS"].append({"id":adverb_id,"text":regexp_definitions.group(1)})
								 adverb_id = adverb_id+1
								if isAdjective == 1:
								 if "ADJECTIVE" not in tempWord["TYPE"]:
								  tempWord["TYPE"].append("ADJECTIVE")
								 tempWord["ADJECTIVE"]["DEFINITIONS"].append({"id":adjective_id,"text":regexp_definitions.group(1)})
								 adjective_id = adjective_id+1
								if isVerb == 1:
								 if "VERB" not in tempWord["TYPE"]:
								  tempWord["TYPE"].append("VERB")
								 tempWord["VERB"]["DEFINITIONS"].append({"id":verb_id,"text":regexp_definitions.group(1)})
								 verb_id = verb_id+1
					if regexp_trans is not None:
							#print('TRANS')
							if "VERB" not in tempWord["TYPE"]:
							 tempWord["TYPE"].append("VERB")
							tempWord["VERB"]["DEFINITIONS"].append({"id":verb_id,"text":regexp_trans.group(1)})
							#print(regexp_trans.group(1).encode(encoding='UTF-8',errors='strict'))
							verb_id = verb_id+1
				
					if regexp_intrans is not None:
							#print('INTRANS')
							if "VERB" not in tempWord["TYPE"]:
							 tempWord["TYPE"].append("VERB")
							#print(regexp_intrans.group(1).encode(encoding='UTF-8',errors='strict'))
							tempWord["VERB"]["DEFINITIONS"].append({"id":verb_id,"text":regexp_intrans.group(1)})
							verb_id = verb_id+1
					if regexp_ti_verb is not None:
							#print('INTRANS')
							if "VERB" not in tempWord["TYPE"]:
							 tempWord["TYPE"].append("VERB")
							#print(regexp_intrans.group(1).encode(encoding='UTF-8',errors='strict'))
							tempWord["VERB"]["DEFINITIONS"].append({"id":verb_id,"text":regexp_ti_verb.group(1)})
							verb_id = verb_id+1
					regexp_Noun = re.search(".*{{countable}}(.*)$", ver)
					if regexp_Noun is not None:
							#print(' NOUN')
							if "NOUN" not in tempWord["TYPE"]:
							 tempWord["TYPE"].append("NOUN")
							tempWord["NOUN"]["DEFINITIONS"].append({"id":noun_id,"text":regexp_Noun.group(1)})
							noun_id = noun_id+1
					regexp_Redirect = re.search("# {{.*of\|(.*)}}", ver)
					if regexp_Redirect is not None:
							print(regexp_Redirect.group(3))

			 WORDS_JSON.append(tempWord)
			 elem.clear()

json.dump(WORDS_JSON,f, indent=4)
sys.stdout = orig_stdout
f.close()
	  
  
  

 


