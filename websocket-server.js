import WebSocket, { WebSocketServer } from "ws";
import speech from "@google-cloud/speech";
import { Transform } from "stream";
import dotenv from "dotenv";

dotenv.config();

const client = new speech.SpeechClient();
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
        console.log("Client connected");

        const recognizeStream = client
                .streamingRecognize({
                        config: {
                                encoding: "MULAW",
                                sampleRateHertz: 8000,
                                languageCode: "en-US",
                        },
                        interimResults: true,
                })
                .on("data", (data) => console.log(`Transcription: ${data.results[0] && data.results[0].alternatives[0].transcript}`));

        ws.on("message", (message) => {
                const audioStream = new Transform();
                audioStream.push(message);
                audioStream.pipe(recognizeStream);
        });

        ws.on("close", () => {
                console.log("Client disconnected");
                recognizeStream.end();
        });
});

console.log("WebSocket server is running on ws://localhost:8080");
