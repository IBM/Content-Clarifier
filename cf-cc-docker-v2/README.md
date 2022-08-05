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


