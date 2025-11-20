import { Flex } from "@/components/flex";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Featured (props: AppProps) {
  return (
    <div>
      <Flex {...props} />
    </div>
  )
}
