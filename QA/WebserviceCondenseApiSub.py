import requests
import json
from decimal import Decimal
import timeit
import sys
import ConfigParser,io
from backports import configparser
import glob, os
from textstat.textstat import textstat
import csv
from fnmatch import fnmatch

settings = configparser.ConfigParser()                                #
settings_interpolation = configparser.ExtendedInterpolation()         #
settings.read('setting.ini')                                          #Read config file

#Read the txt file
def readFile(file1):
  try:
    with open(file1, 'r') as myfile: # Provide complete file path
      data=myfile.read().replace('\n', '')
      return data
  except IOError:
    print 'Cannot Open', filename
  except:
    print 'Unexpected Error', sys.exc_info()[0]

#Function to print column output side by side
def ReadDir():
  root = settings.get('Path', 'DirectoryName')
  pattern = "*.txt"
  lst= []
  for path, subdirs, files in os.walk(root):
    for name in files:
        if fnmatch(name, pattern):
            lst.append(os.path.join(path, name))
  Metric(lst)

def Metric(listOfFiles):
        os.chdir(settings.get('Path', 'DirectoryName'))
        i=0
        totalInput=[0] * len(listOfFiles)
        totalOutput=[0] * len(listOfFiles)
        Ratio=0.0
        SRatio=0.0
        InputWord=0.0
        OutputWord=0.0
        with open(settings.get('Path', 'OutputFile')+'ZCResult.csv', 'w') as csvfile:
            fieldnames = ['Filename','Words in input', 'Words in output','File Summarization ratio','Total Input words','Total Output words','Summarization Ratio']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for file in listOfFiles:
              data=readFile(file)
              Input= str(data)
              InputSplit=Input.split()
              payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI", "data":data, "options":{"condenseMode":"abstraction"}}
              url = settings.get('API', 'URL')
              headers = {"Content-Type": "application/json"}
              response = requests.post(url,headers = headers,data = json.dumps(payload))
              OUTPUT=response.json()
              OutputSplit=OUTPUT['condensed'].split()
              datasplit=OUTPUT['condensed'].splitlines()
              InputWord=len(InputSplit)
              InputWordLen= str(InputWord)
              OutputWord=len(datasplit[0].split())
              OutputWordLen=str(OutputWord)
              totalInput[i]=InputWord
              totalOutput[i]=OutputWord
              Ratio=OutputWord/float(InputWord)
              SRatio=(1-Ratio)*100
              SRatioRound=str(round(SRatio,0))
              fh=open(settings.get('Path', 'OutputFile')+'ZCResult.txt',"a")
              fh.write('\n\nFile Name: '+file)
              fh.write('\nWords in input= '+ InputWordLen)
              fh.write('\nWords in output= '+ OutputWordLen)
              fh.write("\nFile Summarization ratio: "+SRatioRound)
              if SRatio>50:
                fh.write("\nSummarization Ratio is more than 50%")
              else:
                fh.write("\nSummarization Ratio is less than 50%")
              
              writer.writerow({'Filename':file, 'Words in input': InputWordLen, 'Words in output': OutputWordLen, 'File Summarization ratio':str(round(SRatio,0))})
              i=i+1
          
        TotalInput=0.0
        TotalOutput=0.0
        
        for i in range(0,len(totalInput)):
          TotalInput=TotalInput+totalInput[i]
        for i in range(0,len(totalOutput)):
          TotalOutput=TotalOutput+totalOutput[i]
        TRatio=TotalOutput/TotalInput
        TSRatio=(1-Ratio)*100
        SRatio_Round=str(round(TSRatio,0))
        fh=open(settings.get('Path', 'OutputFile')+'ZCResult.txt',"a")
        fh.write("\n\n\nTotal Input words: "+str(round(TotalInput,0)))
        fh.write("\nTotal Output words: "+str(round(TotalOutput,0)))
        fh.write("\nSummarization ratio: "+str(round(TSRatio,0)))
        if SRatio>50:
            fh.write("\nSummarization Ratio is more than 50%")
        else:
            fh.write("\nSummarization Ratio is less than 50%")
        with open(settings.get('Path', 'OutputFile')+'ZCResult.csv', 'a') as csvfile:
          writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
          #writer.writeheader()
          writer.writerow({'Total Input words': str(round(TotalInput,0)) ,'Total Output words': str(round(TotalOutput,0)),'Summarization Ratio':str(round(TSRatio,0))})
        fh.close()
        
def main():
        # print command line arguments
        if sys.argv[1]=='--m' and sys.argv[2]=='metric':
                ReadDir()
                sys.exit()
        
if __name__ == "__main__":
    main()


