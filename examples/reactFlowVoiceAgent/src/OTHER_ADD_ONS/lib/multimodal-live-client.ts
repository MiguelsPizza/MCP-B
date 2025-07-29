// /**
//  * Copyright 2024 Google LLC
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

// import { type Content, type GenerativeContentBlob, type Part } from "@google/generative-ai";
// import { EventEmitter } from "eventemitter3";
// import { difference } from "lodash";
// import {
//   type ClientContentMessage,
//   isInterrupted,
//   isModelTurn,
//   isServerContentMessage,
//   isSetupCompleteMessage,
//   isToolCallCancellationMessage,
//   isToolCallMessage,
//   isShellCommandMessage,
//   isShellResponseMessage,
//   isTurnComplete,
//   type LiveIncomingMessage,
//   type ModelTurn,
//   type RealtimeInputMessage,
//   type ServerContent,
//   type SetupMessage,
//   type StreamingLog,
//   type ToolCall,
//   type ToolCallCancellation,
//   type ToolResponseMessage,
//   type ShellCommandMessage,
//   type ShellCommandResponse,
//   type LiveConfig,
//   type ShellResponseMessage,
// } from "../types/multimodal-live-types";
// import { blobToJSON, base64ToArrayBuffer } from "./utils";
// // import { config } from "dotenv";

// /**
//  * the events that this client will emit
//  */
// interface MultimodalLiveClientEventTypes {
//   open: () => void;
//   log: (log: StreamingLog) => void;
//   close: (event: CloseEvent) => void;
//   audio: (data: ArrayBuffer) => void;
//   content: (data: ServerContent) => void;
//   interrupted: () => void;
//   setupcomplete: () => void;
//   turncomplete: () => void;
//   toolcall: (toolCall: ToolCall) => void;
//   toolcallcancellation: (toolcallCancellation: ToolCallCancellation) => void;
//   shellcommand: (command: string) => void;
//   shellresponse: (response: ShellCommandResponse) => void;
// }

// export type MultimodalLiveAPIClientConnection = {
//   url?: string;
//   apiKey: string;
// };

// let fullResponse = ""

// /**
//  * A event-emitting class that manages the connection to the websocket and emits
//  * events to the rest of the application.
//  * If you dont want to use react you can still use this.
//  */
// export class MultimodalLiveClient extends EventEmitter<MultimodalLiveClientEventTypes> {
//   public ws: WebSocket | null = null;
//   protected config: LiveConfig | null = null;
//   public url: string = "";
//   public getConfig() {
//     return { ...this.config };
//   }

//   constructor({ url, apiKey }: MultimodalLiveAPIClientConnection) {
//     super();
//     url =
//       url ||
//       `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
//     url += `?key=${apiKey}`;
//     this.url = url;
//     this.send = this.send.bind(this);
//   }

//   log(type: string, message: StreamingLog["message"]) {
//     const log: StreamingLog = {
//       date: new Date(),
//       type,
//       message,
//     };
//     this.emit("log", log);
//     // console.log("LOG", log);
//   }

//   connect(config: LiveConfig): Promise<boolean> {
//     this.config = config;

//     // console.log("config: ", JSON.stringify(config, null, 2));

//     const ws = new WebSocket(this.url);

//     ws.addEventListener("message", async (evt: MessageEvent) => {
//       if (evt.data instanceof Blob) {
//         this.receive(evt.data);
//       } else {
//         console.log("non blob message", evt);
//       }
//     });
//     return new Promise((resolve, reject) => {
//       const onError = (ev: Event) => {
//         this.disconnect(ws);
//         const message = `Could not connect to "${this.url}"`;
//         // this.log(`server.${ev.type}`, message);
//         reject(new Error(message));
//       };
//       ws.addEventListener("error", onError);
//       ws.addEventListener("open", (ev: Event) => {
//         if (!this.config) {
//           reject("Invalid config sent to `connect(config)`");
//           return;
//         }
//         // this.log(`client.${ev.type}`, `connected to socket`);
//         this.emit("open");

//         this.ws = ws;

//         const setupMessage: SetupMessage = {
//           setup: this.config,
//         };
//         this._sendDirect(setupMessage);
//         // this.log("client.send", "setup");

//         ws.removeEventListener("error", onError);
//         ws.addEventListener("close", (ev: CloseEvent) => {
//           // console.log(ev);
//           this.disconnect(ws);
//           let reason = ev.reason || "";
//           if (reason.toLowerCase().includes("error")) {
//             const prelude = "ERROR]";
//             const preludeIndex = reason.indexOf(prelude);
//             if (preludeIndex > 0) {
//               reason = reason.slice(
//                 preludeIndex + prelude.length + 1,
//                 Infinity,
//               );
//             }
//           }
//           // this.log(
//           //   `server.${ev.type}`,
//           //   `disconnected ${reason ? `with reason: ${reason}` : ``}`,
//           // );
//           this.emit("close", ev);
//         });
//         resolve(true);
//       });
//     });
//   }

//   disconnect(ws?: WebSocket) {
//     // could be that this is an old websocket and theres already a new instance
//     // only close it if its still the correct reference
//     if ((!ws || this.ws === ws) && this.ws) {
//       this.ws.close();
//       this.ws = null;
//       // this.log("client.close", `Disconnected`);
//       return true;
//     }
//     return false;
//   }

//   protected async receive(blob: Blob) {
//     const response: LiveIncomingMessage = (await blobToJSON(
//       blob,
//     )) as LiveIncomingMessage;

//     if (isToolCallMessage(response)) {
//       this.log("server.toolCall", response);
//       this.emit("toolcall", response.toolCall);
//       return;
//     }

//     if (isToolCallCancellationMessage(response)) {
//       // this.log("receive.toolCallCancellation", response);
//       this.emit("toolcallcancellation", response.toolCallCancellation);
//       return;
//     }

//     if (isShellCommandMessage(response)) {
//       // this.log("server.shellCommand", response);"server.send"
//       this.emit("shellcommand", response.shellCommand.command);
//       return;
//     }

//     if (isShellResponseMessage(response)) {
//       // this.log("server.shellResponse", response);
//       this.emit("shellresponse", response.shellResponse);
//       return;
//     }

//     if (isSetupCompleteMessage(response)) {
//       // this.log("server.send", "setupComplete");
//       this.emit("setupcomplete");
//       return;
//     }

//     // this json also might be `contentUpdate { interrupted: true }`
//     // or contentUpdate { end_of_turn: true }
//     if (isServerContentMessage(response)) {
//       const { serverContent } = response;
//       if (isInterrupted(serverContent)) {
//         // this.log("receive.serverContent", "interrupted");
//         this.emit("interrupted");
//         return;
//       }

      
//       if (isTurnComplete(serverContent)) {
//         console.log("fullResponse", fullResponse);
//         this.log("server.send", fullResponse);

//         fullResponse = "";

//         // this.log("server.send", "turnComplete");
//         this.emit("turncomplete");
//         //plausible theres more to the message, continue
//       }

//       if (isModelTurn(serverContent)) {
//         let parts: Part[] = serverContent.modelTurn.parts;

//         // when its audio that is returned for modelTurn
//         const audioParts = parts.filter(
//           (p) => p.inlineData && p.inlineData.mimeType.startsWith("audio/pcm"),
//         );
//         const base64s = audioParts.map((p) => p.inlineData?.data);

//         // strip the audio parts out of the modelTurn
//         const otherParts = difference(parts, audioParts);
//         // console.log("otherParts", otherParts);
//         // console.log("otherParts", parts);

//         const part = parts.map((p) => p.text).join("");
//         fullResponse += part;
//         console.log("part", part);

//         base64s.forEach((b64) => {
//           if (b64) {
//             const data = base64ToArrayBuffer(b64);
//             this.emit("audio", data);
//             // this.log(`server.audio`, `buffer (${data.byteLength})`);
//           }
//         });
//         if (!otherParts.length) {
//           return;
//         }

//         parts = otherParts;

//         const content: ModelTurn = { modelTurn: { parts } };
//         this.emit("content", content);
//         // this.log(`server.content`, response);

//       }
//     } else {
//       console.log("received unmatched message", response);
//     }
//   }

//   /**
//    * Send a shell command to be executed
//    */
//   sendShellCommand(command: string) {
//     const message: ShellCommandMessage = {
//       shellCommand: {
//         command,
//         timestamp: new Date().toISOString(),
//       },
//     };

//     this._sendDirect(message);
//     // this.log(`client.shellCommand`, message);
//   }

//   /**
//    * Send the response from a shell command execution
//    */
//   sendShellResponse(commandId: string, output: string, error?: string) {
//     const response: ShellCommandResponse = {
//       commandId,
//       output,
//       error,
//       timestamp: new Date().toISOString(),
//     };

//     this._sendDirect({ shellResponse: response });
//     // this.log(`client.shellResponse`, response.output);
//   }

//   /**
//    * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
//    */
//   sendRealtimeInput(chunks: GenerativeContentBlob[]) {
//     // console.log("sendRealtimeInput", chunks);
//     let hasAudio = false;
//     let hasVideo = false;
//     for (let i = 0; i < chunks.length; i++) {
//       const ch = chunks[i];
//       if (ch.mimeType.includes("audio")) {
//         hasAudio = true;
//       }
//       if (ch.mimeType.includes("image")) {
//         hasVideo = true;
//       }
//       if (hasAudio && hasVideo) {
//         break;
//       }
//     }
//     const message =
//       hasAudio && hasVideo
//         ? "audio + video"
//         : hasAudio
//           ? "audio"
//           : hasVideo
//             ? "video"
//             : "unknown";

//     const data: RealtimeInputMessage = {
//       realtimeInput: {
//         mediaChunks: chunks,
//       },
//     };
//     // console.log("data", data);
//     this._sendDirect(data);
//     // this.log(`client.realtimeInput`, message);
//     // console.log("sendRealtimeInput", message);
//     // console.log("data", data);
//   }

//   /**
//    *  send a response to a function call and provide the id of the functions you are responding to
//    */
//   sendToolResponse(toolResponse: ToolResponseMessage["toolResponse"]) {
//     const message: ToolResponseMessage = {
//       toolResponse,
//     };

//     this._sendDirect(message);
//     // this.log(`client.toolResponse`, message);
//   }

//   /**
//    * send normal content parts such as { text }
//    */
//   send(parts: Part | Part[], turnComplete: boolean = true) {
//     parts = Array.isArray(parts) ? parts : [parts];
//     const content: Content = {
//       role: "user",
//       parts,
//     };

//     const clientContentRequest: ClientContentMessage = {
//       clientContent: {
//         turns: [content],
//         turnComplete,
//       },
//     };

//     console.log("clientContentRequest", clientContentRequest);

//     this._sendDirect(clientContentRequest);
//     // this.log(`client.send`, clientContentRequest);
//   }

//   /**
//    *  used internally to send all messages
//    *  don't use directly unless trying to send an unsupported message type
//    */
//   _sendDirect(request: SetupMessage | ClientContentMessage | ToolResponseMessage | RealtimeInputMessage | ShellCommandMessage | ShellResponseMessage) {
//     if (!this.ws) {
//       throw new Error("WebSocket is not connected");
//     }
//     // console.log("request", request);
//     const str = JSON.stringify(request);

//     this.ws.send(str);
//   }
// }



