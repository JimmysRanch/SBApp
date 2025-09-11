"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";

export default function ClientIdScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: IScannerControls | undefined;

    const start = async () => {
      try {
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (res, err) => {
            if (res) {
              setResult(res.getText());
              setError(null);
              controls?.stop();
            } else if (err && !(err instanceof NotFoundException)) {
              setError("Unable to read ID");
            }
          }
        );
      } catch (e: any) {
        setError(e?.message || "Unable to access camera");
      }
    };

    start();
    return () => {
      controls?.stop();
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Scan Driver License</h1>
        <video ref={videoRef} className="w-full max-w-md border" />
        {error && <p className="mt-2 text-red-600">{error}</p>}
        {result && (
          <div className="mt-4">
            <p className="font-semibold">Raw data</p>
            <pre className="whitespace-pre-wrap break-words bg-gray-100 p-2 rounded">{result}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

