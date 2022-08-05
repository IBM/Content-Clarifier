import requests
import json
from decimal import Decimal
import timeit
import sys
import ConfigParser,io
from backports import configparser

settings = configparser.ConfigParser()                                #
settings_interpolation = configparser.ExtendedInterpolation()         #
settings.read('setting.ini')                                          #Read config file

start_time = timeit.default_timer()
#Read the txt file
def readFile():
  try:
    filename = settings.get('Path', 'InputFileName')
    with open(filename, 'r') as myfile: # Provide complete file path
      data=myfile.read().replace('\n', '')
      return data
  except IOError:
    print 'Cannot Open', filename
  except:
    print 'Unexpected Error', sys.exc_info()[0]
'''
  filename = settings.get('Path', 'InputFileName')
  with open(filename, 'r') as myfile: # Provide complete file path
    data=myfile.read().replace('\n', '')
    return data
'''
#Make a POST request
def consumePOSTRequest():
 payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}
 url = settings.get('API', 'URL')
 headers = {"Content-Type": "application/json"}
 response = requests.post(url,headers = headers,data = json.dumps(payload))
consumePOSTRequest()

#Function to print column output side by side
def Pretty():
  INstr=readFile()
  inputSplit=INstr.split()
  payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}
  url = settings.get('API', 'URL')
  headers = {"Content-Type": "application/json"}
  response = requests.post(url,headers = headers,data = json.dumps(payload))
  print response.content
  OUTPUT=response.json()
  
  outsplit=OUTPUT['simplified'].split()
  OutCount =0
  InCount=0
  i=0 #current OutPut Index
  j=0 #current Input Index
  while i<len(outsplit) or j < len(inputSplit):
    while( i<len(outsplit) and(OutCount + len(outsplit[i]) + 1) <75):
      sys.stdout.write(outsplit[i]+ " ")
      OutCount = OutCount + len(outsplit[i]) + 1
      i = i + 1
    
    while(OutCount<=75):
                    sys.stdout.write(" ")
                    OutCount=OutCount+1
    OutCount=0
    sys.stdout.write(" | ")
    while(j<len(inputSplit) and(InCount + len(inputSplit[j]) + 1) <75):
      sys.stdout.write(inputSplit[j]+ " ")
      InCount = InCount + len(inputSplit[j]) + 1
      j = j + 1
    sys.stdout.write("\n")
    InCount=0

#Function to parse output on labels
def Parseable():
    data=readFile()
    INPUT= str(data)
    print '[INPUT] \n \n'+ INPUT
    payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":data}
    url = settings.get('API', 'URL')
    headers = {"Content-Type": "application/json"}
    print 'URL==>'+url
    print 'Data==>'+json.dumps(payload)
    response = requests.post(url,headers = headers,json = json.dumps(payload))
    print 'test:'+response.content
    OUTPUT=response.json()          
    #print '[OUTPUT] \n'
    print OUTPUT['simplified']

#Function to place replaced words inline 
def Inline():
    String=readFile()
    InputSplit=String.split()
    payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}                            #Pass the file content as text
    url = settings.get('API', 'URL')
    headers = {"Content-Type": "application/json"}
    response = requests.post(url,headers = headers,data = json.dumps(payload))
    OUTPUT=response.json()
    Output=OUTPUT['simplified']
    OutputSplit=OUTPUT['simplified'].split()
    Replace_Elements = {}
    for a, b in zip(InputSplit, OutputSplit):
       if a != b:
         Replace_Elements[a]=b
    for key in Replace_Elements:
      if Replace_Elements[key] in Output:
        temp_value= Replace_Elements[key]
        new_value=temp_value[1:len(temp_value)-1]           #Slice braces from the replaced words
        Output=Output.replace(Replace_Elements[key],"[ "+key+"/"+new_value+"]")
    print "Inline Output: \n \n"+ Output

#Function to display word counts 
def Metric():
        data=readFile()
        Input= str(data)
        InputSplit=Input.split()
        payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}
        url = settings.get('API', 'URL')
        headers = {"Content-Type": "application/json"}
        response = requests.post(url,headers = headers,data = json.dumps(payload))
        OUTPUT=response.json()
        OutputSplit=OUTPUT['simplified'].split()
        ReplaceWordCount=0
        for Iword, Rword in zip(InputSplit, OutputSplit):
                if Iword != Rword:
                        ReplaceWordCount=ReplaceWordCount+1
        InputWord=len(InputSplit)
        InputWordLen= str(InputWord)
        ReplacedWordLen=str(ReplaceWordCount)
        ReplacedWordPer=(float(ReplaceWordCount)/InputWord)*100
        NotReplacedWordPer=100-ReplacedWordPer
        elapsed = timeit.default_timer() - start_time
        print '\n[Replaced Percentage]'
        print 'Total-words-in-input= '+ InputWordLen
        print 'Total-words-replaced= '+ ReplacedWordLen
        print 'Percent-words-replaced= '+ str(ReplacedWordPer)
        print 'Percent-words-not-replaced= '+ str(NotReplacedWordPer)
        

def ExecTime():
        elapsed = timeit.default_timer() - start_time
        print 'Execution Time is: '+ str(elapsed)+'ms'

def main():
        # print command line arguments
        if sys.argv[1]=='--f' and sys.argv[2]=='pretty':
                Pretty()
                sys.exit()
        if sys.argv[1]=='--f' and sys.argv[2]=='inline':
                Inline()
                sys.exit()
        elif sys.argv[1]=='--f' and sys.argv[2]=='parseable':
                Parseable()
                sys.exit()
        elif sys.argv[1]=='--m' and sys.argv[2]=='executiontime':
                ExecTime()  
                sys.exit()
        elif sys.argv[1]=='--m' and sys.argv[2]=='metric':
                Metric()
                sys.exit()
                      
if __name__ == "__main__":
    main()


