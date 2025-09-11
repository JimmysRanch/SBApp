"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface LicenseScannerProps {
  onResult: (data: string) => void;
  onClose: () => void;
}

export default function LicenseScanner({ onResult, onClose }: LicenseScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
    const reader = new BrowserMultiFormatReader(hints);
    const video = videoRef.current;
    let active = true;
    let controls: { stop: () => void } | undefined;

    if (video) {
      reader.decodeFromVideoDevice(
        undefined,
        video,
        (result, err, c) => {
          controls = c;
          if (!active) return;
          if (result) {
            onResult(result.getText());
            c.stop();
            active = false;
          }
        }
      );
    }

    return () => {
      active = false;
      controls?.stop();
      const stream = video?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <video ref={videoRef} className="w-full max-w-md" />
      <button className="mt-4 bg-white px-4 py-2 rounded" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
