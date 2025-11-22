import type { Resource } from "../messages";

import { apiClient } from "~/lib/api-client";
import { resolveServiceURL } from "./resolve-service-url";

export async function queryRAGResources(query: string): Promise<Array<Resource>> {
  try {
    const res = await apiClient.get<{ resources: Array<Resource> }>(
      resolveServiceURL(`rag/resources?query=${query}`)
    );
    return res.resources;
  } catch (error) {
    console.error("Failed to query RAG resources:", error);
    return [];
  }
}
