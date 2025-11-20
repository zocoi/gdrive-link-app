import { Carousel } from "@/components/carousel";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Featured(props: AppProps) {
  return (
    <div className="p-3">
      <Carousel {...props} />
    </div>
  );
}
