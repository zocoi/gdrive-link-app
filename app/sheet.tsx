import { Uploader } from "@/components/uploader";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Classic(props: AppProps) {
  return (
    <div className="p-4">
      <Uploader {...props} />
    </div>
  );
}
