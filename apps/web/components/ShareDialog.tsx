"use-client";

import { useState } from "react";

export const ShareDialog = ({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const canvasUrl = `${window.location.origin}/canvas/${roomId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(canvasUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Share Canvas</h3>
        <p className="text-sm text-gray-600 mb-2">
          Share this link to collaborate in real-time:
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={canvasUrl}
            readOnly
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {isCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
};
