import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { v4 as uuidv4 } from "uuid";
import { getEmbeddings } from "@/lib/embeddings";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY as string | undefined;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
);

function toJSONLine(obj: any) {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(toJSONLine({ stage: "start", message: "Uploading file" }));

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
          controller.enqueue(toJSONLine({ stage: "error", message: "No file provided" }));
          controller.close();
          return;
        }

        const id = uuidv4();
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `documents/${id}.${ext}`;

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, arrayBuffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });
        if (uploadError) {
          controller.enqueue(toJSONLine({ stage: "error", message: `Upload failed: ${uploadError.message}` }));
          controller.close();
          return;
        }
        controller.enqueue(toJSONLine({ stage: "uploaded", path }));

        // Detect type and extract text
        controller.enqueue(toJSONLine({ stage: "extracting", message: "Detecting type and extracting text" }));
        const mime = file.type;
        let rawText = "";

        if (mime === "application/pdf" || ext === "pdf") {
          const data = await pdf(Buffer.from(arrayBuffer));
          // pdf-parse separates pages by form feed \f sometimes; use text as-is
          rawText = data.text || "";
        } else if (mime?.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) {
          if (OCR_SPACE_API_KEY) {
            // Prefer OCR.Space
            const ocrRes = await fetch("https://api.ocr.space/parse/image", {
              method: "POST",
              headers: {
                apikey: OCR_SPACE_API_KEY,
              } as any,
              body: (() => {
                const fd = new FormData();
                fd.append("language", "eng");
                fd.append("isOverlayRequired", "false");
                fd.append("OCREngine", "2");
                fd.append("file", new Blob([arrayBuffer], { type: file.type }), file.name);
                return fd;
              })(),
            });
            const ocrJson: any = await ocrRes.json();
            const parsedText = ocrJson?.ParsedResults?.map((r: any) => r.ParsedText).join("\n") || "";
            rawText = parsedText;
          } else {
            const { data: tData } = await Tesseract.recognize(new Blob([arrayBuffer], { type: file.type }), "eng");
            rawText = tData?.text || "";
          }
        } else {
          // Fallback: try to read as text
          try {
            rawText = new TextDecoder().decode(arrayBuffer);
          } catch {
            rawText = "";
          }
        }

        if (!rawText || rawText.trim().length === 0) {
          controller.enqueue(toJSONLine({ stage: "error", message: "No text extracted" }));
          controller.close();
          return;
        }

        controller.enqueue(toJSONLine({ stage: "insert_document", message: "Inserting document" }));
        const { error: insertDocError } = await supabase.from("documents").insert({
          id,
          storage_path: path,
          raw_text: rawText,
          created_at: new Date().toISOString(),
        });
        if (insertDocError) {
          controller.enqueue(toJSONLine({ stage: "error", message: `Document insert failed: ${insertDocError.message}` }));
          controller.close();
          return;
        }

        controller.enqueue(toJSONLine({ stage: "splitting", message: "Splitting text into chunks" }));
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const docs = await splitter.createDocuments([rawText]);
        const chunks = docs.map((d, i) => ({ index: i, content: d.pageContent }));

        controller.enqueue(toJSONLine({ stage: "embedding", message: `Generating embeddings for ${chunks.length} chunks` }));
        const vectors = await getEmbeddings(chunks.map((c) => c.content));

        controller.enqueue(toJSONLine({ stage: "inserting_chunks", message: "Inserting chunk embeddings" }));
        const rows = chunks.map((c, i) => ({
          document_id: id,
          chunk_index: c.index,
          content: c.content,
          embedding: vectors[i],
          created_at: new Date().toISOString(),
        }));
        const { error: insertChunksError } = await supabase.from("document_chunks").insert(rows);
        if (insertChunksError) {
          controller.enqueue(toJSONLine({ stage: "error", message: `Chunk insert failed: ${insertChunksError.message}` }));
          controller.close();
          return;
        }

        controller.enqueue(toJSONLine({ stage: "done", id }));
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(JSON.stringify({ stage: "error", message: err?.message || "Unknown error" }) + "\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
