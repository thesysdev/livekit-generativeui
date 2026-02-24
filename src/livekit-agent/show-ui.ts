import { llm } from "@livekit/agents";
import OpenAI from "openai";
import { z } from "zod";

const THESYS_MODEL = "c1/google/gemini-3-flash/v-20251230";

const THESYS_SYSTEM_PROMPT = `You are being used in tandem with a voice agent.
The voice agent LLM decides what to show on the screen and calls you with the content to generate a visual UI.
The content will be passed as the user message and your job is to convert that content into a visually appealing and interactive UI component.`;

export class ShowUITool {
  private abortController: AbortController | null = null;
  private readonly thesysClient: OpenAI;

  constructor(private readonly room: any) {
    this.thesysClient = new OpenAI({
      // baseURL: "http://localhost:3001/c1/v1/visualize",
      baseURL: "https://api.thesys.dev/v1/embed",
      apiKey: process.env.THESYS_API_KEY,
    });
  }

  get tool() {
    return llm.tool({
      description:
        "Display rich visual UI to the user. Pass the COMPLETE structured content you want to visualize. " +
        "The content will be converted into a beautiful interactive UI component. " +
        "Use this for comparisons, lists, structured data, cards, etc. " +
        "The content you provide will be returned back to you so you know what was shown.",
      parameters: z.object({
        content: z
          .string()
          .describe(
            "The full structured content to display visually. Be detailed and specific.",
          ),
      }),
      execute: async ({ content }) => {
        console.log(`[show_ui] Visualizing (${content.length} chars)`);

        // Cancel any previous in-flight stream before starting a new one
        this.abortController?.abort();
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        // Stream the UI in the background so the LLM can speak immediately
        (async () => {
          let writer: Awaited<
            ReturnType<typeof this.room.localParticipant.streamText>
          > | null = null;
          try {
            writer = await this.room.localParticipant.streamText({
              topic: "genui",
            });
            const stream = await this.thesysClient.chat.completions.create(
              {
                // model: "c1-internal/moonshotai/kimi-k2/v-dev",
                model: THESYS_MODEL,
                messages: [
                  { role: "system", content: THESYS_SYSTEM_PROMPT },
                  { role: "user", content },
                ],
                stream: true,
              },
              { signal },
            );
            let total = 0;
            for await (const chunk of stream) {
              if (signal.aborted) break;
              const delta = chunk.choices[0]?.delta?.content;
              if (delta) {
                total += delta.length;
                await writer.write(delta);
              }
            }
            await writer.close();
            console.log(`[show_ui] Streamed ${total} chars`);
          } catch (err: any) {
            try {
              await writer?.close();
            } catch {}
            if (err?.name !== "AbortError" && !signal.aborted) {
              console.error("[show_ui] Background stream error:", err);
            }
          }
        })();

        // Return immediately so the LLM generates speech while the UI renders
        return `UI is loading on screen. Tell the user in 1-2 natural sentences what you are showing them.`;
      },
    });
  }
}
