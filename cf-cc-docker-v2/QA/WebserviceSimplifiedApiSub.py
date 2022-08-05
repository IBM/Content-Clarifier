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

start_time = timeit.default_timer()
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
    totalInputSyllable=[0]*len(listOfFiles)
    totalOutputSyllable=[0]*len(listOfFiles)
    with open(settings.get('Path', 'OutputFile')+'ZSResult.csv', 'w') as csvfile:
      fieldnames = ['Filename', 'Total words in input','Percent words replaced','Percent words not replaced','Input Syllable Count','Output Syllable Count','Syllable Summarization Ratio']
      writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
      writer.writeheader()
      for file in listOfFiles:
        data=readFile(file)
        Input= str(data)
        InputSplit=Input.split()
        payload ={"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","flavor": "text", "data":data, "options":{"outputMode":2}}
        url = settings.get('API', 'URL')
        headers = {"Content-Type": "application/json"}
        response = requests.post(url,headers = headers,data = json.dumps(payload))
        OUTPUT=response.json()
        OutputSplit=OUTPUT['simplified'].split()
        datasplit=OUTPUT['simplified'].splitlines()
        InputWord=len(InputSplit)
        InputWordLen= str(InputWord)
        OutputWord=len(datasplit[0].split())
        OutputWordLen=str(OutputWord)
        elapsed = timeit.default_timer() - start_time
        totalInput[i]=InputWord
        totalOutput[i]=OutputWord
        ReplaceWordCount=0
        for Iword, Rword in zip(InputSplit, OutputSplit):
                if Iword != Rword:
                        ReplaceWordCount=ReplaceWordCount+1
        ReplacedWordLen=str(ReplaceWordCount)
        ReplacedWordPer=(float(ReplaceWordCount)/InputWord)*100
        NotReplacedWordPer=100-ReplacedWordPer

                
        InputSyllable=textstat.syllable_count(Input)
        OutputSyllable=textstat.syllable_count(datasplit[0])
        totalInputSyllable[i]=InputSyllable
        totalOutputSyllable[i]=OutputSyllable
        
        Ratio_Sy=OutputSyllable/InputSyllable
        SRatio_Sy=(1-Ratio_Sy)*100
        
        fh=open(settings.get('Path', 'OutputFile')+'ZSResult.txt',"a")
        fh.write('\n\nFile Name: '+file)
        fh.write('\nTotal words in input= '+ InputWordLen)
        fh.write('\nTotal words in output= '+ OutputWordLen)
        fh.write('\nTotal-words-replaced= '+ ReplacedWordLen)
        fh.write('\nPercent-words-replaced= '+ str(round(ReplacedWordPer,0)))
        fh.write('\nPercent-words-not-replaced= '+ str(round(NotReplacedWordPer,0)))
        fh.write('\nInput Syllable Count= '+ str(round(InputSyllable,0)))
        fh.write('\n')
        fh.write('\nOutput Syllable Count= '+ str(round(OutputSyllable,0)))
        fh.write('\nSyllable Count Ratio= '+ str(round(SRatio_Sy,0)))
        writer.writerow({'Filename':file,'Total words in input':InputWordLen,'Percent words replaced':str(round(ReplacedWordPer,0)),'Percent words not replaced':str(round(NotReplacedWordPer,0)),'Input Syllable Count':str(round(InputSyllable,0)),'Output Syllable Count':str(round(OutputSyllable,0)),'Syllable Summarization Ratio':str(round(SRatio_Sy,0))})
        i=i+1
    
    TotalInput=0.0
    TotalOutput=0.0
    AvgInput=0.0
    AvgOutput=0.0
    InputAvg=0.0
    OutputAvg=0.0
    TotalInputSyllable=0.0
    TotalOutputSyllable=0.0
    
    for i in range(0,len(totalInput)):
        TotalInput=TotalInput+totalInput[i]
        AvgInput=AvgInput+totalInput[i]
        InputAvg=AvgInput/len(totalInput)
    for i in range(0,len(totalOutput)):
        TotalOutput=TotalOutput+totalOutput[i]
        AvgOutput=AvgOutput+totalOutput[i]
        OutputAvg=AvgOutput/len(totalOutput)
    
    for i in range(0,len(totalInputSyllable)):
      TotalInputSyllable=TotalInputSyllable+totalInputSyllable[i]
    for i in range(0,len(totalOutputSyllable)):
      TotalOutputSyllable=TotalOutputSyllable+totalOutputSyllable[i]

    Ratio_Sy=TotalOutputSyllable/TotalInputSyllable
    SRatio_Sy=(1-Ratio_Sy)*100
    fh=open(settings.get('Path', 'OutputFile')+'ZSResult.txt',"a")
    fh.write("\n\n\nTotal Input words: "+str(round(TotalInput,0)))
    fh.write("\nTotal Output words: "+str(round(TotalOutput,0)))
    fh.write("\nAverage of total Input words: "+str(round(InputAvg,0)))
    fh.write("\nAverage of total Output words: "+str(round(OutputAvg,0)))
    fh.write('\n\nTotal Input Syllable Count= '+ str(round(TotalInputSyllable,0)))
    fh.write('\nTotal Output Syllable Count= '+ str(round(TotalOutputSyllable,0)))
    fh.write('\nTotal Syllable Summarization Ratio= '+ str(round(SRatio_Sy,0)))
    '''
    with open(settings.get('Path', 'OutputFile')+'ZSResult.csv', 'a') as csvfile:
      writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
      writer.writerow({'Total Input words':str(round(TotalInput,0)),'Total Output words':str(round(TotalOutput,0)),'Average of total Input words':str(round(InputAvg,0)),'Average of total Output words':str(round(OutputAvg,0)),'Total Input Syllable Count':str(round(TotalInputSyllable,0)),'Total Output Syllable Count':str(round(TotalOutputSyllable,0)),'Total Syllable Summarization Ratio':str(round(SRatio_Sy,0))})
    '''
    fh.close()

def main():
        # print command line arguments

        if sys.argv[1]=='--m' and sys.argv[2]=='metric':
                ReadDir()
                sys.exit()

if __name__ == "__main__":
    main()

    
