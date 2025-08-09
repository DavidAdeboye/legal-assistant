"use client";

import React, { useCallback, useRef, useState } from "react";
import { useUploadStore } from "@/store/upload";

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { addJob, updateJob, completeJob, failJob } = useUploadStore();
  const [dragOver, setDragOver] = useState(false);

  const startUpload = useCallback(async (file: File) => {
    const jobId = crypto.randomUUID();
    addJob({ id: jobId, filename: file.name, progress: 0, status: "uploading" });

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok || !res.body) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.stage === "error") {
              failJob(jobId, evt.message || "Error");
            } else if (evt.stage === "uploaded") {
              updateJob(jobId, { progress: 20, status: "processing" });
            } else if (evt.stage === "extracting") {
              updateJob(jobId, { progress: 40 });
            } else if (evt.stage === "insert_document") {
              updateJob(jobId, { progress: 55 });
            } else if (evt.stage === "splitting") {
              updateJob(jobId, { progress: 65 });
            } else if (evt.stage === "embedding") {
              updateJob(jobId, { progress: 80 });
            } else if (evt.stage === "inserting_chunks") {
              updateJob(jobId, { progress: 90 });
            } else if (evt.stage === "done") {
              completeJob(jobId);
            }
          } catch (e) {
            // ignore JSON parse errors for partial lines
          }
        }
      }
    } catch (e: any) {
      failJob(jobId, e?.message || "Upload failed");
    }
  }, [addJob, updateJob, completeJob, failJob]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) startUpload(f);
  }, [startUpload]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${dragOver ? "bg-gray-100" : "bg-white"}`}
        onClick={() => inputRef.current?.click()}
      >
        <p>Drag and drop a PDF or image here, or click to select</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) startUpload(f);
          }}
        />
      </div>
    </div>
  );
}
