# https://console.ng.bluemix.net/docs/containers/container_cfapp_tutorial_intro.html#container_cfapp_tutorial_intro

#Use the IBM Node image as a base image
FROM registry.ng.bluemix.net/ibmnode:latest

#Expose the port for your Content Clarifier web service, and set 
#it as an environment variable as expected by cf apps
ENV PORT=3000
EXPOSE 3000
ENV NODE_ENV production

#Copy all app files from the current directory into the app 
#directory in your container. Set the app directory
#as the working directory
ADD . /app
WORKDIR /app

# https://developer.ibm.com/recipes/tutorials/creating-custom-docker-image-with-ibm-containers/

# Copy the software archives into the Docker image

# Create a java directory in the docker image
RUN mkdir /usr/local/java

# Copy the local files to the created directory
COPY jdk1.7.0_79 /usr/local/java/jdk1.7.0_79

# 
RUN update-alternatives --install "/usr/local/bin/java" "java" "/usr/local/java/jdk1.7.0_79/jre/bin/java" 1
RUN update-alternatives --set java /usr/local/java/jdk1.7.0_79/jre/bin/java

RUN chmod 777 -R /usr/local/java

## Set JAVA_HOME environment variable 
ENV JAVA_HOME "/usr/local/java/jdk1.7.0_79"
RUN echo $JAVA_HOME

## Set JRE_HOME environment variable
ENV JRE_HOME "$JAVA_HOME/jre"
RUN echo $JRE_HOME

## Set PATH environment variable 
ENV PATH "$PATH:$JAVA_HOME/bin:$JRE_HOME/bin"
RUN echo $PATH

## Set JAVA heap size
ENV JAVA_OPTS="-Xmx6g"
RUN java -jar jconsole.jar &
RUN java -XX:+PrintFlagsFinal -version | grep -iE 'heapsize|permsize|threadstacksize'


## Set LD_LIBRARY_PATH
ENV LD_LIBRARY_PATH "$JRE_HOME/lib/amd64:$JRE_HOME/lib/amd64/server"
RUN echo $LD_LIBRARY_PATH

# Validate the configuration
RUN java -version

#Install additional modules not already in docker node_modules
RUN npm install java@0.7.2
RUN npm install git+https://github.com/kareem1234/node-stanford-simple-nlp

RUN rm -Rf /app/node_modules/stanford-simple-nlp/jar
COPY stanford_jars /app/node_modules/stanford-simple-nlp/jar

#Sleep before the app starts. This command ensures that the
#IBM Containers networking is finished before the app starts. 
CMD (sleep 60; npm start)

#Start the Content Clarifier web service. 
CMD ["node", "/app/server.js"]
