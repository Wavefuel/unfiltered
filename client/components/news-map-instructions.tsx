"use client";

import { AlertCircle } from "lucide-react";

export default function MapboxInstructions() {
  return (
    <div className="p-4 border rounded-md bg-amber-50 border-amber-200 mb-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-amber-800">Mapbox Setup Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            To use the interactive map, you need to:
          </p>
          <ol className="text-sm text-amber-700 mt-2 list-decimal pl-5 space-y-1">
            <li>
              Sign up for a free Mapbox account at{" "}
              <a
                href="https://account.mapbox.com/auth/signup/"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                mapbox.com
              </a>
            </li>
            <li>Create an access token in your Mapbox account</li>
            <li>
              Replace{" "}
              <code className="bg-amber-100 px-1 py-0.5 rounded">
                YOUR_MAPBOX_TOKEN
              </code>{" "}
              in the{" "}
              <code className="bg-amber-100 px-1 py-0.5 rounded">
                news-map.tsx
              </code>{" "}
              file
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
