"use client";
import Dropzone from "@/components/Dropzone";
import { useUploadStore } from "@/store/upload";

export default function DashboardPage() {
  const { jobs } = useUploadStore();
  const jobList = Object.values(jobs);
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Dropzone />
      {jobList.length > 0 && (
        <div className="space-y-2">
          {jobList.map((j) => (
            <div key={j.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{j.filename}</span>
                <span>{j.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div className={`h-2 rounded ${j.status === "error" ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${j.progress}%` }} />
              </div>
              <div className="text-sm text-gray-600">{j.status}{j.error ? `: ${j.error}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
