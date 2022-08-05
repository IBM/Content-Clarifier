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

def Metric():
        data=readFile()
        Input= str(data)
        InputSplit=Input.split()
        payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","flavor": "text", "data":readFile(), "options":{"condenseMode":"abstraction"}}
        url = settings.get('API', 'URL')
        headers = {"Content-Type": "application/json"}
        response = requests.post(url,headers = headers,data = json.dumps(payload))
        OUTPUT=response.json()
        OutputSplit=OUTPUT['condensed'].split()
        '''
        ReplaceWordCount=0
        for Iword, Rword in zip(InputSplit, OutputSplit):
                if Iword != Rword:
                        ReplaceWordCount=ReplaceWordCount+1
        InputWord=len(InputSplit)
        InputWordLen= str(InputWord)
        ReplacedWordLen=str(ReplaceWordCount)
        ReplacedWordPer=(float(ReplaceWordCount)/InputWord)*100
        NotReplacedWordPer=100-ReplacedWordPer
        '''
        InputWord=len(InputSplit)
        InputWordLen= str(InputWord)
        ReplacedWordLen=str(ReplaceWordCount)
        elapsed = timeit.default_timer() - start_time
        print '\n[Replaced Percentage]'
        print 'Total-words-in-input= '+ InputWordLen
        print 'Total-words-replaced= '+ OutputSplit
        print 'Percent-words-replaced= '+ str(ReplacedWordPer)
        print 'Percent-words-not-replaced= '+ str(NotReplacedWordPer)

def main():
        # print command line arguments

        if sys.argv[1]=='--m' and sys.argv[2]=='metric':
                Metric()
                sys.exit()

if __name__ == "__main__":
    main()

    
