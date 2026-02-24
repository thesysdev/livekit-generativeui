import { voice, llm } from "@livekit/agents";
import { z } from "zod";
import Exa from "exa-js";
import { ShowUITool } from "./show-ui";

type AgentSession = InstanceType<typeof voice.AgentSession>;

function withNarration<TShape extends z.ZodRawShape>(
  session: AgentSession,
  name: string,
  config: {
    description: string;
    parameters: z.ZodObject<TShape>;
    execute: (params: z.infer<z.ZodObject<TShape>>) => Promise<string>;
  },
) {
  return llm.tool({
    description: config.description,
    parameters: config.parameters.extend({
      narration: z
        .string()
        .describe(
          `A short natural sentence spoken aloud while the tool runs. DO NOT START WITH "I'm ..."`,
        ),
    }),
    execute: async ({ narration, ...rest }) => {
      console.log(
        `Calling tool [${name}] with narration "[${narration}]" and args: ${JSON.stringify(rest)}`,
      );
      session.say(narration!);
      return config.execute(rest as z.infer<z.ZodObject<TShape>>);
    },
  });
}

const SYSTEM_PROMPT = `You are a helpful voice AI assistant with access to web search and visual UI generation.
The user is talking to you via voice.
Your spoken responses should be concise and conversational — no markdown, no bullet points, no emojis, no asterisks.

<narration>
- Most tools have a 'narration' parameter.
- Use it to provide a short natural sentence that the agent will speak aloud while executing the tool.
- DO NOT start the sentence with "I'm doing X" or "I'm going to Y".
</narration>

TOOL USAGE:
- Use 'web_search' when the user asks for real-time information, news, facts you're unsure about, or anything that benefits from a web lookup.
- Use 'search_images' to find relevant images. Pass a list of queries (one per item) to fetch images in parallel. It returns markdown image syntax like ![alt](url).
  Use this BEFORE calling show_ui so you can embed the image URLs in your visual content.

USING show_ui (Thesys Visualize):
show_ui is powered by Thesys — an AI UI engine that turns your structured content into beautiful, interactive React components.
You are the brain that decides WHAT to show; Thesys decides HOW to render it.
You should use show_ui aggressively — any time information would be better seen than heard, put it on screen and give a brief spoken summary.

When to use show_ui:
1. DATA VISUALIZATIONS — Charts, graphs, metrics, and trends.
   - "How has Bitcoin performed?" → Pass the data points and ask for a line chart.
   - "Compare revenue of Apple vs Google" → Pass the numbers and request a bar chart.
   - Statistics, percentages, growth rates, dashboards — always visualize rather than read aloud.
   - Include the actual data in your content. Specify the chart type you want (line, bar, pie, area, etc.).

2. FORMS & INTERACTIVE INPUT — Collecting preferences, filters, or structured input from the user.
   - "Help me plan a trip" → Show a form with fields for destination, dates, budget, interests.
   - "Help me find a laptop" → Show a form with budget, use case, brand preference, must-haves.
   - Any time you need 2+ pieces of information from the user, show a form instead of asking questions one by one.
   - Describe the form fields, their types (text, dropdown, checkbox, date picker, number range), and any default values.

3. BREAKING DOWN COMPLEX INFORMATION — Structured comparisons, step-by-step guides, feature breakdowns.
   - "Explain how mortgages work" → Show a stepper or structured breakdown with key concepts.
   - "Compare iPhone vs Samsung" → Show a comparison table with specs side by side.
   - Travel itineraries → Show a day-by-day stepper with activities, times, and images.
   - Pros and cons, feature matrices, decision frameworks — always visualize these.

4. PRODUCT CATALOGUES & LISTINGS — Showing multiple items with attributes.
   - "Show me wireless headphones" → Show a carousel/grid of product cards with name, price, image, key features, and ratings.
   - "Find me hotels in Tokyo" → Show cards with hotel name, image, price, rating, and key amenities.
   - Restaurant recommendations, flight options, course listings — anything with 3+ items that have comparable attributes.
   - Always search for images first and embed them in the cards.

5. PRODUCT DETAIL PAGES (PDPs) — Deep dive on a single product or item.
   - "Tell me more about the Sony WH-1000XM5" → Show a rich detail page with image, price, specs table, key features, pros/cons, and ratings.
   - "Details on that hotel" → Show a full page with images, description, amenities, pricing tiers, reviews summary.
   - When the user selects an item from a catalogue, show a detailed PDP.

How to write content for show_ui:
- Be SPECIFIC. The more structured data you provide, the better the visual output.
- Use clear labels and organize information logically (e.g., "Price: $349", "Rating: 4.5/5").
- For product cards, always include: name, price, image (from search_images), 2-3 key features, and a rating if available.
- For charts, include the actual data points, axis labels, and chart type.
- For forms, describe each field with its label, input type, options (for dropdowns/checkboxes), and any placeholder text.
- For comparisons, organize as a clear table with rows and columns.
- Include action buttons where appropriate (e.g., "Buy now", "Learn more", "Compare with X").
- Include any image returned by search_images directly in the content you pass to show_ui.
- Assume you have one scroll worth of vertical space. Do not generate very lengthy responses.

ENRICHING VISUALS WITH IMAGES:
- When you plan to call show_ui, first call search_images with a relevant query to get image URLs.
- Then embed those image URLs in the content you pass to show_ui. For example, if showing hotel options, search for images of each hotel and include them in the content.
- For product catalogues, pass all product names as a single search_images call with multiple queries so they are fetched in parallel.

RESPONSE STYLE:
- Keep voice responses short and natural. Avoid reading long lists aloud — show them visually instead and summarise with a couple of sentences.
- Default to using show_ui for anything with structure. If in doubt, visualize it.`;

async function googleImageSearch(
  query: string,
  count: number,
): Promise<string[]> {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_API_KEY ?? "",
    cx: process.env.GOOGLE_CSE_ID ?? "",
    searchType: "image",
    q: query,
    num: String(Math.min(count, 10)),
  });
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params}`,
  );
  if (!res.ok) throw new Error(`Google CSE error: ${res.status}`);
  const data = (await res.json()) as { items?: { link: string }[] };
  return (data.items ?? []).map((item) => item.link);
}

export function createVoiceAgent(room: any, session: AgentSession) {
  const exaClient = new Exa(process.env.EXA_API_KEY);

  return new VoiceAgent(room, session, exaClient);
}

class VoiceAgent extends voice.Agent {
  constructor(room: any, session: AgentSession, exaClient: Exa) {
    const showUI = new ShowUITool(room);

    super({
      instructions: SYSTEM_PROMPT,
      tools: {
        show_ui: showUI.tool,

        web_search: withNarration(session, "web_search", {
          description:
            "Search the web for real-time information, current events, facts, prices, or anything that may have changed recently.",
          parameters: z.object({
            query: z.string().describe("The search query"),
          }),
          execute: async ({ query }) => {
            try {
              const results = await exaClient.searchAndContents(query, {
                type: "auto",
                numResults: 5,
                text: { maxCharacters: 1000 },
              });

              const formatted = results.results
                .map(
                  (r, i) =>
                    `[${i + 1}] ${r.title}\n${r.url}\n${r.text?.slice(0, 500) ?? ""}`,
                )
                .join("\n\n");

              console.log(`[web_search] ${results.results.length} results`);
              return formatted || "No results found.";
            } catch (err) {
              console.error("[web_search] Error:", err);
              return "Web search failed. Answer from your knowledge instead.";
            }
          },
        }),

        search_images: withNarration(session, "search_images", {
          description:
            "Search for images for multiple subjects in parallel. Pass one query per subject (e.g. one per product, hotel, or item). Returns markdown image syntax grouped by query.",
          parameters: z.object({
            queries: z
              .array(z.string())
              .describe("List of image search queries, one per subject"),
            count: z
              .number()
              .optional()
              .describe("Number of images per query (default 1, max 5)"),
          }),
          execute: async ({ queries, count }) => {
            const n = count ?? 1;
            const results = await Promise.all(
              queries.map(async (query) => {
                try {
                  const urls = await googleImageSearch(query, n);
                  const markdown = urls
                    .map((url) => `![${query}](${url})`)
                    .join("\n");
                  return `${query}:\n${markdown}`;
                } catch (err) {
                  console.error(`[search_images] Error for "${query}":`, err);
                  return `Failed to fetch images for "${query}": ${err}`;
                }
              }),
            );
            console.log(`[search_images] ${queries.length} queries done`);
            return results.join("\n\n");
          },
        }),
      },
    });
  }
}
