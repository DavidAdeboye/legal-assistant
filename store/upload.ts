"use client";

import { create } from "zustand";

export type UploadJob = {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
};

type UploadState = {
  jobs: Record<string, UploadJob>;
  addJob: (job: UploadJob) => void;
  updateJob: (id: string, patch: Partial<UploadJob>) => void;
  completeJob: (id: string) => void;
  failJob: (id: string, error: string) => void;
};

export const useUploadStore = create<UploadState>((set) => ({
  jobs: {},
  addJob: (job) => set((s) => ({ jobs: { ...s.jobs, [job.id]: job } })),
  updateJob: (id, patch) => set((s) => ({ jobs: { ...s.jobs, [id]: { ...s.jobs[id], ...patch } } })),
  completeJob: (id) => set((s) => ({ jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "done", progress: 100 } } })),
  failJob: (id, error) => set((s) => ({ jobs: { ...s.jobs, [id]: { ...s.jobs[id], status: "error", error } } })),
}));
