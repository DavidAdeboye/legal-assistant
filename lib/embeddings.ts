import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string | undefined;
const GROQ_API_KEY = process.env.GROQ_API_KEY as string | undefined;

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (GOOGLE_API_KEY) {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const batches: number[][][] = [];
    const batchSize = 100; // API allows batching
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const res = await model.batchEmbedContents({
        requests: batch.map((t) => ({ content: { parts: [{ text: t }] } })),
      } as any);
      // @ts-ignore
      const vectors = res.embeddings.map((e: any) => e.values as number[]);
      batches.push(vectors);
    }
    return batches.flat();
  }

  if (GROQ_API_KEY) {
    // Groq OpenAI-compatible embeddings endpoint
    const results: number[][] = [];
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const input = texts.slice(i, i + batchSize);
      const resp = await fetch("https://api.groq.com/openai/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input,
        }),
      });
      if (!resp.ok) {
        throw new Error(`Groq embeddings failed: ${resp.status} ${resp.statusText}`);
      }
      const json = await resp.json();
      const vectors = json.data.map((d: any) => d.embedding as number[]);
      results.push(...vectors);
    }
    return results;
  }

  throw new Error("No embeddings provider configured. Set GOOGLE_API_KEY or GROQ_API_KEY.");
}
