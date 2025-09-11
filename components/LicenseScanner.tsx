"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
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
    let controls: IScannerControls | undefined;

    const start = async () => {
      if (!video) return;
      video.setAttribute("playsinline", "true");
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          devices[0]?.deviceId;
        controls = await reader.decodeFromVideoDevice(
          deviceId,
          video,
          (result, err, c) => {
            if (!active) return;
            if (result) {
              onResult(result.getText());
              c.stop();
              active = false;
            }
          }
        );
      } catch (e) {
        console.error(e);
        onClose();
      }
    };

    start();

    return () => {
      active = false;
      controls?.stop();
      const stream = video?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <video ref={videoRef} className="w-full max-w-md" />
      <button className="mt-4 bg-white px-4 py-2 rounded" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
