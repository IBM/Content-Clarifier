import requests
import json
import sys
def readFile():
  with open('D:\\project docs\\Text Simplification project\\convote_v1.1.tar\\convote_v1.1\\convote_v1.1\\data_stage_one\\development_set\\052_400011_0327014_DON.txt', 'r') as myfile:
    data=myfile.read().replace('\n', '')
    return data

def inline():
  with open('D:\\project docs\\Text Simplification project\\convote_v1.1.tar\\convote_v1.1\\convote_v1.1\\data_stage_one\\development_set\\052_400011_0327014_DON.txt', 'r') as myfile:
        INstr=myfile.read().replace('\n', '')
        inputSplit=INstr.split()
        #print inputSplit
  payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}
  url = 'http://textsimplificationapp.stage1.mybluemix.net/api-simplify'
  headers = {"Content-Type": "application/json"}
  response = requests.post(url,headers = headers,data = json.dumps(payload))
  #print '\n \n'
  OUTstring=str(response.text)
  OUTsplit= OUTstring.split('"')
  OUTPUT=OUTsplit[7]
  outsplit=OUTPUT.split()
  #print outsplit
  #print len(OUTPUT)
  #print len(INstr)
  OutGlobalCount=0
  InGlobalCount=0
  OutCount =0
  InCount=0
  myCount =0
  
  
  while myCount < len(INstr):
    for OutWord in OUTPUT:
      if OutCount <75 and OutGlobalCount < len(OUTPUT):
        sys.stdout.write(OUTPUT[OutGlobalCount])
        OutCount = OutCount +1
        OutGlobalCount = OutGlobalCount +1
        
        #myCount = myCount+1
      elif OutCount <75 and OutGlobalCount == len(OUTPUT):
        sys.stdout.write(" ")
        OutCount = OutCount +1
        
      else:
        break
      
    if OutCount ==75 and InCount <75 :
      sys.stdout.write(" | ")
    for InWord in INstr:
      if InCount <75 and InGlobalCount < len(INstr):
        sys.stdout.write(INstr[InGlobalCount])
        InCount=InCount+1
        InGlobalCount=InGlobalCount+1
      elif InCount <75 and InGlobalCount == len(INstr):
        sys.stdout.write(" ")
        InCount = InCount +1
      else:
        break
           
    if OutCount ==75 and InCount ==75:
          sys.stdout.write("\n")
          OutCount =0
          InCount=0
          myCount = myCount+75

inline()  
