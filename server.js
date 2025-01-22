// const express = require('express');
// const cors = require('cors');
//const morgan = require('morgan');
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import AssistantV2 from 'ibm-watson/assistant/v2.js';
import { IamAuthenticator } from 'ibm-watson/auth/index.js';
import got from 'got';
//import stream from 'node:stream';
import {createParser} from 'eventsource-parser'
// import {pipeline as streamPipeline} from 'node:stream/promises';
// import { parseSSE } from './sseParser.js';
import 'dotenv/config' ;

const assistant_url = process.env.ASSISTANT_URL;
const assistant_id = process.env.ASSISTANT_ID;
const draft_env_id = process.env.DRAFT_ENV_ID;
const live_env_id = process.env.LIVE_ENV_ID;
const environment_id = draft_env_id;

const app = express();
app.use(morgan('dev')); 
app.use(bodyParser.json());

app.use((req, res, next)=> {    // with this morgan will log everything
    next();
});

// Use CORS middleware
// app.use(cors());
const apikey = process.env.APIKEY;
/*
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://iam.cloud.ibm.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,  x-requested-by");
    //res.header("Access-Control-Allow-Headers", "x-requested-with, x-requested-by");
    res.header('Access-Control-Allow-Credentials: true');
    res.header("Access-Control-Allow-Methods", "GET, POST");
    next();
});
*/
app.use(express.static('./public'));

app.post('/api/session', async function(req, res) {
    const iam = new IamAuthenticator({
        apikey: apikey,
    })
    const assistant = new AssistantV2({ version: '2024-08-25', authenticator: iam })
    assistant.setServiceUrl(assistant_url);
    const createSessionResponse = await assistant.createSession({
        assistantId: environment_id,
    });
    const { status } = createSessionResponse;
    if (status < 200 || status > 299) {
        res.status(500).send({error: 'Error creating a session' + createSessionResponse.statusText});
    } else { 
        const sessionId = createSessionResponse.result.session_id;
        console.log("session id created = " + sessionId);
        res.send({session_id: sessionId});
    }
});
app.post('/api/message', async function(req, res) {
    const message = req.body.message;
    const sessionId = req.body.session;
    console.log(req.body); 
    /** 
    const auth_token_body = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apikey}`;
    const response = await got.post("https://iam.cloud.ibm.com/identity/token", { body:  auth_token_body,  headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).json();
    const token = response.access_token;
    console.log("Got iam token: ",token);
    const headers = {
        "Accept": "application/json",
        //'Accept': 'text/event-stream',
        "Content-Type": "application/json",
        "User-Agent": "ibm-node-sdk-core/mcsp-authenticator-4.3.4 os.name=darwin os.version=23.5.0 node.version=v23.1.0",
        "Authorization": "Bearer " + token,
        "Connection": "keep-alive",
        "Accept-Encoding": "gzip"
    }
    const url = `${assistant_url}/v2/assistants/${environment_id}/sessions/${sessionId}/message?version=2024-08-25`;
    const messagePayload = {
        "input": {
            "text": message,
            "message_type": "text",
            "options": {
                "export": true,
                "debug": true,
                "return_context": true,
            }
        },
        "context": {
            "skills": {
                "main skill": {
                    "user_defined": {
                         "user_group": "staff"
                    }
                }
            }
        }
    };
    try {
        const resp = await got.post(url, {headers: headers, json: messagePayload}).json();
        console.log('Response: ',JSON.stringify(resp,null,2));
        res.send(resp);
    }   catch(e) {
        console.log("Error: ",e);
        res.status(500).send({error: e});
    }
    **/
    const assistant = new AssistantV2({
      version: '2024-08-25',
      authenticator: new IamAuthenticator({
        apikey: apikey,
      }),
      serviceUrl: assistant_url,
    });
    assistant.message({
        //assistantId: assistant_id,
        assistantId: environment_id,
        environmentId: environment_id,
        sessionId: sessionId,
        input: {
          'message_type': 'text',
          'text': message
        },
        context: {
            skills: {
                "main skill": {
                    user_defined: {
                       user_group: 'staff'
                    }
                }
            }
        }
    }).then(resp => {
          console.log(JSON.stringify(resp.result, null, 2));
          res.send(resp.result);
    }).catch(err => {
          console.log(err);
          res.status(500).send({error: err});
    });
});

async function sendChunk(res,out){
    return new Promise(function(resolve,reject){
        if (res.write(out,()=>{resolve();})=== false){
            console.log("Draining buffer");
            res.once('drain',()=>{
                resolve();
            });
        }
    });
}

app.get('/api/message_stream', async function(req, res) {
    //const message = req.body.message;
    //const sessionId = req.body.session;
    let message =  req.query.message;
    let sessionId = req.query.session;

    console.log(req.query); 
    const auth_token_body = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apikey}`;
    const response = await got.post("https://iam.cloud.ibm.com/identity/token", { body:  auth_token_body,  headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).json();
    const token = response.access_token;
    console.log("Got iam token: ",token);
    const headers = {
        // "Accept": "application/json",
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
        "User-Agent": "ibm-node-sdk-core/mcsp-authenticator-4.3.4 os.name=darwin os.version=23.5.0 node.version=v23.1.0",
        "Authorization": "Bearer " + token,
        "Connection": "keep-alive",
        "Accept-Encoding": "gzip"
    }
    const stream_url = `${assistant_url}/v2/assistants/${assistant_id}/environments/${environment_id}/sessions/${sessionId}/message_stream?version=2024-08-25`;
    const url = `${assistant_url}/v2/assistants/${environment_id}/sessions/${sessionId}/message?version=2024-08-25`;
    const messagePayload = {
        "input": {
            "text": message,
            "message_type": "text",
            "options": {
                "export": true,
                "debug": true,
                "return_context": true,
            }
        },
        "context": {
            "skills": {
                "main skill": {
                    "user_defined": {
                        "is_streaming": true,
                         "user_group": "staff"
                    }
                }
            }
        }
    };
    /*
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    */
    const onError = error => {
       console.log("Encounter error in got.stream.post! error: ", error); 
    };
    var completed = false;
    async function onEvent(event) {
        let chunk = "";
        console.log('Received event of type: ',typeof(event));
        //console.log('data: %s', event.data)
        chunk += `event: ${event.event}\n` 
        chunk += `data: ${JSON.stringify(JSON.parse(event.data))}\n\n`
        console.log('data: %s', chunk);
        await sendChunk(res,chunk);
        // res.write(JSON.stringify(event));
        try {
           const final_resp = event.data.final_response;
           completed = true;
           // console.log("final_response, close event_stream!!");
           //res.end();
        }  catch (e) {
        }
    }
    const parser = createParser({onEvent});
    parser.reset();
    try {
        const stream = got.stream.post(
            stream_url, {
                json: messagePayload,
                headers: headers
            }
        );
        /*
        stream.on('response', async response => {
            console.log("In got.stream.post(response) => ",response.ok);
         });
         stream.once('error', onError);
        */
        var first = true;
        for await(const chunk of stream) {
            if (first) {
                res.writeHead(200,{
                    "content-type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Content-Encoding": "none",
                    "Connection": "keep-alive"});
                first = false;   
            }
            // console.log("chunk receive in stream, chunk type: ",typeof(chunk));
            parser.feed(chunk.toString()) 
        }
        // if (completed) res.end();
    } catch (e) {
        console.log("Encounter error in stream, should close connection! e: ",e);
        res.send(500,{error: e});
    }
    /*
    (async () => {
        try {
            console.log('Starting SSE stream...');
            const data = await parseSSE(stream_url, messagePayload, headers, req,res);
            console.log('SSE data collected:', data);
        } catch (error) {
            console.error('Error processing SSE stream:', error);
        }
    })();
    */
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});