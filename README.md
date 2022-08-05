# Content Clarifier

This repository is for the **Content Clarifier**, a Cognitive Computing effort to perform content simplification, summarization, and enhancement.

The Content Clarifier is a callable API that builds upon IBM Watson deep learning APIs to include a service that dynamically simplifies, summarizes or enhances content to increase comprehension. There are three modes of output: 

**Simplified:** Lexical and grammatical manipulation is performed to improve comprehension. Simplified mode also supports enabling "enhanced content", which returns word definitions additional information about identified topics. 

**Condensed:** Content is summarized for quick reading. 

**Ultra-Mode:** A second pass of simplification is performed on summarized content.

<hr>

**Install Note:** **1.** You should download stan-core-jar.zip file and unzip contents to the ./node_modules/stanford-simple-nlp/jar folder. You can download the file from https://ibm.box.com/s/wvq31ln3io1am2i2vwa3fuhr075xi6il. **2.** You should place the AACSymbols.json file in the ./model folder. You can download the file from https://ibm.box.com/s/cxc7eqbeymi7bcnbc29d1nvd49i4dvtq Neither of these files could be pushed to github because of their sizes (exceeding the 100MB limit). 

**Running the Server Locally:** The server can consume system memory resources due to hashmaps loaded in the server's memory. To address this, allocate more memory (4GB or more) to the node server running locally. Specifically, start the server with:
**node --max_old_space_size=4096  server.js**

<hr>

**Mac user tips & tricks**
When trying to setup your local env on a Mac, you might run in to a few issue.
Here are a few tip and tricks to help you get going. 
1. You must use node version 5.12.0, can you download the .pkg file from
https://nodejs.org/download/release/v5.12.0/
2. When doing an npm install, you might have an issue with following module: stanford-simple-nlp
When trying to install you might see several errors and unable to install. 
You might be to solve this with option A or optino B. 
A. Install the module like this: npm install stanford-simple-nlp@0.2.2
If this works, you're go to go. If not try option B. 
B. If option A still giving you errors try the following: 
npm install stanford-simple-nlp@git+https://github.com/kareem1234/node-stanford-simple-nlp
If this is succesful you will need to edit the package.json file located Text-Simplification/package.jason
Edit line 53 to be like this: 
 "stanford-simple-nlp": "git+https://github.com/kareem1234/node-stanford-simple-nlp",
 Save the file and start the server. 
 If option A or B did not work for you, good luck searching and makesure you document your findings. 

