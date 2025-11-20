import { Uploader } from "@/components/uploader";
import { Carousel } from "@/components/carousel";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Classic(props: AppProps) {
  return (
    <div className="space-y-4 p-4">
      <Uploader {...props} />
      <Carousel {...props} />
    </div>
  );
}
