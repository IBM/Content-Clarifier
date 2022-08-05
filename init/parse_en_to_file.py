import sys
import pymongo
import json





#client = pymongo.MongoClient("localhost", 27017)

#db =client.myDB

f=open('c:/python_code/th_en_US_new.dat','r')

dict_list_data=list(f)
f.close()
"""
count= db.dictionaryCollection.find().count()
count=count+1
db.dictionaryCollection.insert({"name":"dict_"+str(count),"dict_list":dict_list_data})"""





"""for doc in db.dictionaryCollection.find({"name":"dict_"+str(count)}):
    print(doc)"""

#print(db.dictionaryCollection.find().count())
#print("word collection count is %d",count)
#db.wordCollection.remove()
#count= db.wordCollection.find().count()

#db.th_newCollection.remove()
#print("word collection count is %d",count)

pointer=0
setCounter =-1
tempWord = {"Word":"","noun":[],"adj":[],"adv":[]}
seen = set()
th_list =[]

for wor in dict_list_data:
	#tempList = wor.split("|")
	#print(pointer);
	if pointer==0:
		print(pointer)
		print("Writing Json Data to file...")	
	elif  setCounter==-1:
		 tempList = wor.split("|")
		 tempWord={"WORD":"","TYPE":[],"NOUN":[],"ADJECTIVE":[],"ADVERB":[]}
		 tempWord["WORD"]=tempList[0]
		 setCounter=pointer+ int(tempList[1])
	else:
		tempList = wor.split("|")
		#print("tempList:"+ str(tempList))
		if tempList[0]=="(noun)":
                       for num in range(1, len(tempList)):                                tempWord["NOUN"].append(tempList[num])
                       if "NOUN" not in tempWord["TYPE"]:
                        tempWord["TYPE"].append("NOUN")
			
		elif  tempList[0]=="(adj)":
                       for num in range(1, len(tempList)):                                tempWord["ADJECTIVE"].append(tempList[num])
                       if "ADJECTIVE" not in tempWord["TYPE"]:
                        tempWord["TYPE"].append("ADJECTIVE")

		elif tempList[0]=="(adv)":
                       for num in range(1, len(tempList)):                                tempWord["ADVERB"].append(tempList[num])
                       if "ADVERB" not in tempWord["TYPE"]:
                        tempWord["TYPE"].append("ADVERB")

	
	if pointer==setCounter:
		setCounter=-1
		th_list.append(tempWord)
		
	pointer=pointer+1
	#if pointer==100:
	#	break;
				
target = open('c:/python_code/output.json','w')
json.dump(th_list,target, indent=4)
print("Writing Json Data to Completed")			
#for doc in db.th_newCollection.find({"Word":"'tween"}):
#    print(doc)		

"""for wor in dict_list_data:
	count=count+1;db.wordCollection.insert({"Word":wor,"Rank":count})"""
	
""";print("after insert "+wor+"/n");"""
"""for doc in db.wordCollection.find({"Rank":25}):
    print(doc["Word"])"""










