#
# SCRIPT: installNodeDependencies.sh
# 
# DESCRIPTION: Installs npm dependencies for local Content Clarifier NodeJS development environment
#
# DEPENDENCIES
# 1. Assumes NodeJS 5.9.0 is installed https://nodejs.org/download/release/v5.9.0/
#    If node is already installed, to move to 5.9.0
#       sudo npm cache clean -f
#       sudo npm install -g n
#       sudo n 5.9.0
#
# 2. Assumes npm is installed (this is auto installed with NodeJS)
# 3. Run this script from inside the root of the local Content Clarifier project folder
# 4. Requires Java JDK 7 (1.7.80) installed on local OS http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html
#
npm install angular-route@~1.4.1
npm install body-parser@^1.5.2
npm install express@3.x
npm install request@*
npm install express-session@1.14.0
npm install uuid@2.0.2
npm install cfenv@1.0.3
npm install watson-developer-cloud@~1.0.6
npm install errorhandler@~1.4.1
npm install wordpos@1.1.0
npm install lemmer@0.1.6
npm install natural@*
npm install sentence-tokenizer@*
npm install syllable@*
npm install sparql-client@0.2.0
npm install flesch-kincaid@0.1.0
npm install coleman-liau@0.1.0
npm install automated-readability@0.1.0
npm install java@0.7.2
npm install mysql@2.11.1
# npm install stanford-simple-nlp@0.2.2 - Has known issue with node-gyp
# installing from repository below fixes it
# https://github.com/xissy/node-stanford-simple-nlp/issues/14
npm install git+https://github.com/kareem1234/node-stanford-simple-nlp
