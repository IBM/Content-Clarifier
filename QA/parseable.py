import requests
import json

def readFile():
  with open('...\\convote_v1.1.tar\\convote_v1.1\\convote_v1.1\\data_stage_one\\development_set\\052_400011_0327014_DON.txt', 'r') as myfile: # Provide complete file path
    data=myfile.read().replace('\n', '')
    return data

def consumeGETRequestSync():
 payload ={'text':readFile()}
 url = 'http://textsimplificationapp.stage1.mybluemix.net/api-simplify'
 headers = {"Content-Type": "application/json"}
 response = requests.post(url,headers = headers,data = json.dumps(payload))

consumeGETRequestSync()

def Parseable():
    with open('...\\convote_v1.1.tar\\convote_v1.1\\convote_v1.1\\data_stage_one\\development_set\\052_400011_0327014_DON.txt', 'r') as myfile:
     data=myfile.read().replace('\n', '')
     INPUT= str(data)
     #print '[INPUT] \n \n'+ INPUT
    payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","text":readFile()}
    url = 'http://textsimplificationapp.stage1.mybluemix.net/api-simplify'
    headers = {"Content-Type": "application/json"}
    response = requests.post(url,headers = headers,data = json.dumps(payload))
    OutString=str(response.text)
    OutSplit= OutString.split('"')
    OUTPUT=OutSplit[7]
    print '[OUTPUT] \n \n'+ OUTPUT

def main():
        # print command line arguments

        if sys.argv[1]=='--f' and sys.argv[2]=='parseable':
                Parseable()
                sys.exit()
    

