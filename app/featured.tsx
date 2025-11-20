import { Uploader } from "@/components/uploader";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Featured(props: AppProps) {
  return (
    <div>
      <Uploader {...props} />
    </div>
  );
}
