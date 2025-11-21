import { Uploader } from "@/components/uploader";
import { Carousel } from "@/components/carousel";
import "./globals.css";
import type { AppProps } from "@/lib/types";
import { useState } from "react";

export default function Classic(props: AppProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4 p-4">
      <Carousel
        {...props}
        listEndpointUrl="http://localhost:3001/list-drive-images"
        refreshKey={refreshKey}
      />
      <Uploader
        {...props}
        tokenEndpointUrl="http://localhost:3001/upload-to-drive"
        onUploadComplete={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
