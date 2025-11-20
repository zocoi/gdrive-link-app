import { Flex } from "@/components/flex";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function Classic (props: AppProps){
  return (
    <div className="p-4">
      <Flex {...props} />
    </div>
  )
}
