import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { CopilotRuntime, copilotRuntimeNodeExpressEndpoint } from "@copilotkit/runtime";
import { BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";

dotenv.config();

const PYTHON_REMOTE = process.env.COPILOT_REMOTE_URL ?? "http://127.0.0.1:8000/api/copilotkit-remote";
const PORT = Number(process.env.PORT ?? 3001);
const MODEL = process.env.COPILOT_MODEL ?? "openai:gpt-4o-mini";

const SYSTEM_PROMPT = `你是 LabOS 实验室管理平台的智能助手。
你可以查询实验室、仪器、预约、故障等信息，并帮助用户理解当前页面功能。
回答请使用简洁的中文，优先调用工具获取真实数据，不要编造数据。`;

async function fetchRemoteActions() {
  const response = await fetch(`${PYTHON_REMOTE}/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: {} }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load remote actions (${response.status})`);
  }

  const payload = await response.json();
  return payload.actions ?? [];
}

async function executeRemoteAction(name, args) {
  const response = await fetch(`${PYTHON_REMOTE}/action/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arguments: args ?? {} }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? `Remote action failed (${response.status})`);
  }

  return payload.result ?? payload;
}

function parameterSchema(parameters = []) {
  const shape = {};

  for (const parameter of parameters) {
    const key = parameter.name;
    if (!key) continue;

    let schema;
    switch (parameter.type) {
      case "number":
      case "integer":
        schema = z.number();
        break;
      case "boolean":
        schema = z.boolean();
        break;
      default:
        schema = z.string();
        break;
    }

    shape[key] = parameter.required ? schema : schema.optional();
  }

  return z.object(shape);
}

function buildToolsFromActions(actions) {
  return actions.map((action) =>
    defineTool({
      name: action.name,
      description: action.description ?? action.name,
      parameters: parameterSchema(action.parameters),
      execute: async (args) => executeRemoteAction(action.name, args),
    }),
  );
}

async function createRuntime() {
  const actions = await fetchRemoteActions();
  const tools = buildToolsFromActions(actions);

  const builtInAgent = new BuiltInAgent({
    model: MODEL,
    prompt: SYSTEM_PROMPT,
    tools,
    maxSteps: 8,
  });

  return new CopilotRuntime({
    agents: { default: builtInAgent },
  });
}

async function main() {
  const runtime = await createRuntime();
  const { handleRequest } = copilotRuntimeNodeExpressEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", remote: PYTHON_REMOTE, model: MODEL });
  });

  app.use("/api/copilotkit", (req, res) => handleRequest(req, res));

  app.listen(PORT, () => {
    console.log(`Copilot runtime listening on http://127.0.0.1:${PORT}`);
    console.log(`Proxying backend actions from ${PYTHON_REMOTE}`);
  });
}

main().catch((error) => {
  console.error("Failed to start Copilot runtime:", error);
  process.exit(1);
});
