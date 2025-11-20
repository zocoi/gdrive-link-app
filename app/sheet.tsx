import { Uploader } from "@/components/uploader";
import { Carousel } from "@/components/carousel";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Classic(props: AppProps) {
  return (
    <div className="p-4">
      <Carousel images={props.uploadedImages || []} />
      <div className="mt-4">
        <Uploader {...props} />
      </div>
    </div>
  );
}
