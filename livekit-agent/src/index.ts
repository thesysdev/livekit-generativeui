import {
  type JobContext,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  metrics,
  voice,
} from "@livekit/agents";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";
import { createVoiceAgent } from "./agent.js";

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const vad = await silero.VAD.load();
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "deepgram/nova-3", language: "multi" }),
      llm: new inference.LLM({ model: "google/gemini-3-flash" }),
      tts: new inference.TTS({
        model: "inworld/inworld-tts-1",
        voice: "Ashley",
      }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad,
      voiceOptions: {
        allowInterruptions: true,
        preemptiveGeneration: true,
        maxToolSteps: 10,
        minInterruptionDuration: 0.5,
        useTtsAlignedTranscript: true,
      },
    });

    session.on(voice.AgentSessionEventTypes.Error, (err: unknown) => {
      console.error("[session] Error:", err);
    });

    session.on(voice.AgentSessionEventTypes.Close, () => {
      console.log("[session] Closed");
    });

    // const usageCollector = new metrics.UsageCollector();
    // session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
    //   metrics.logMetrics(ev.metrics);
    //   usageCollector.collect(ev.metrics);
    // });

    // ctx.addShutdownCallback(async () => {
    //   const summary = usageCollector.getSummary();
    //   console.log(`Usage: ${JSON.stringify(summary)}`);
    // });

    try {
      await session.start({
        agent: createVoiceAgent(ctx.room, session),
        room: ctx.room,
      });
    } catch (err) {
      console.error("[entry] Failed to start session:", err);
      throw err;
    }

    try {
      await ctx.connect();
    } catch (err) {
      console.error("[entry] Failed to connect to room:", err);
      throw err;
    }

    try {
      session.generateReply({ instructions: "Greet the user briefly." });
    } catch (err) {
      console.error("[entry] Failed to generate greeting:", err);
    }
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "voice-genui-agent",
  }),
);
