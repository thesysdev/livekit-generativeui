import {
  type JobContext,
  type JobProcess,
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
  prewarm: async (proc: JobProcess) => {
    try {
      proc.userData.vad = await silero.VAD.load();
    } catch (err) {
      console.error("[prewarm] Failed to load VAD model:", err);
      throw err;
    }
  },
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "deepgram/nova-3", language: "multi" }),
      llm: new inference.LLM({ model: "google/gemini-3-flash" }),
      tts: new inference.TTS({
        model: "cartesia/sonic-3",
        voice: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad! as silero.VAD,
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
