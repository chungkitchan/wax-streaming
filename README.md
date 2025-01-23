# Watsonx Assistant Web UI using streaming demo

## Overview

Watsonx Assistant API message_streaming is using similar to SSE (Server-Sent Event) mechanism to provide event based streaming.
This repo provide a demo code to demonstrate the streaming vs non-streaming Web UI for chatbot with Watsonx Assistant.
This code is meant to be demonstration or POC only, it is not meant for production as it lack of reliablity and robust testing.

None Streaming           |  Streaming
:-------------------------:|:-------------------------:
![Non Streaming](wxa_non_streaming.gif)  |  ![Streaming](wxa_streaming.gif)

## To run the code locally

1. Clone the git repo to your local machine
1. Set up a .env file which consist of the following parameters which can be obtained from Watsonx Assistant console:
   ```bash
   APIKEY="xxxxxx"
   ASSISTANT_URL="xxxxxx"
   ASSISTANT_ID="xxxx"
   DRAFT_ENV_ID="xxxxxx"
   LIVE_ENV_ID="xxxxxx"
   ```
1. Install the nodejs module by running below command in terminal:
   ```bash
   npm install
   ```
1. Run the server side code in terminal:
   ```
   npm start
   ```
1. From browser access https://localhost:3000/static.html for non streaming web chat UI
1. From browser access https://localhost:3000/stream.html for streaming web chat UI

## To deploy the code as docker

1. Build the docker image with:
   ```
   docker build -t <image-name>:<tag-name> .
   ```
1. Test the docker image locally with:
   ```
   docker run -p port <imagename>:<tagname> -e APIKEY=xxxx -e ASSISTANT_URL=xxxx -e ASSISTANT_ID=xxxx -e DRAFT_ENV_ID=xxxxxx -e LIVE_ENV_ID=xxxxxx
   ```
1. Push the image to any docker registry, eg docker hub with:
   ```
   docker login index.docker.io
   docker push <namespace/imagename>:<tagname>
   ```
1. Deploy the docker image to cloud platform. Eg: deploy to IBM Code Engine with:
   ```
   ibmcloud ce project create --name <project-name>
   ibmcloud ce project select -n <project-name>
   ibmcloud ce application create --name <app-name> --image docker.io/<namespace/imagename>:<tagname> --registry-secret <registry-secret-name> --env APIKEY=xxxx --env ASSISTANT_URL=xxxx --env ASSISTANT_ID=xxxx --env DRAFT_ENV_ID=xxxxxx --env LIVE_ENV_ID=xxxxxx
   ```