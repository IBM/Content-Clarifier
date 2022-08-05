import sys
import json 

f=open('/home/srvadde/Downloads/google-10000-english-master/google-10000-english-usa.txt','r')

dict_list_data=list(f)
f.close()

#print(db.dictionaryCollection.find().count())
#print("word collection count is %d",count)

count= 0
Word_list =[]
print("Writing Json Data to file...")	
for wor in dict_list_data:
	count=count+1
	Word_list.append({"Word":wor.replace("\n",""),"Rank":count})
	
	
target = open('/home/srvadde/Downloads/google-10000-english-master/Word_Ranks.json','w')
json.dump(Word_list,target, indent=4)
print("Writing Json Data to Completed")		









