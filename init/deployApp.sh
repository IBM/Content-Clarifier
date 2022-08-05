cd /Users/scottw1/PROJECTS/Accessibility/ContentClarifier/src/ContentClarifierWebApp_Bluemix
chmod -R 755 /Users/scottw1/PROJECTS/Accessibility/ContentClarifier/src/ContentClarifierWebApp_Bluemix/*
cf api https://api.ng.bluemix.net
cf login -u email@us.ibm.com -p password -o 'email@us.ibm.com' -s dev

# Nodejs apps that must be deployed with JDK require the following 3 steps at least one to set the env variables:
# See http://stackoverflow.com/questions/36358991/deploy-a-node-js-app-with-a-node-jdbc-module-to-bluemix
# (DEA  Deprecated: Don't use this line) cf set-env ContentClarifierApp JAVA_HOME /tmp/staged/app/jdk1.7.0_79
# (Diego support) 
# cf set-env ContentClarifierApp JAVA_HOME /tmp/app/jdk1.7.0_79
# cf set-env ContentClarifierApp LD_LIBRARY_PATH /home/vcap/app/jdk1.7.0_79/jre/lib/amd64:/home/vcap/app/jdk1.7.0_79/jre/lib/amd64/server
# cf restage ContentClarifierApp 

# Push app
cf push ContentClarifierApp -n contentclarifier -m 4096M -k 2G -b nodejs_buildpack
