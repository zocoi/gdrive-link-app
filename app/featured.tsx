import { Carousel } from "@/components/carousel";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Featured(props: AppProps) {
  return (
    <div>
      <Carousel images={props.uploadedImages || []} />
    </div>
  );
}
