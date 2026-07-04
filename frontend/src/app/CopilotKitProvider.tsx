import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import type { ReactNode } from "react";

interface CopilotKitProviderProps {
  children: ReactNode;
}

export function CopilotKitProvider({ children }: CopilotKitProviderProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      credentials="include"
      enableInspector={false}
      showDevConsole={false}
      onError={(event) => {
        console.error("[CopilotKit]", event);
      }}
    >
      {children}
    </CopilotKit>
  );
}
