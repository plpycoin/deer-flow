// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from "~/lib/api-client";
import { resolveServiceURL } from "./resolve-service-url";

export async function generatePodcast(content: string) {
  const response = await apiClient.fetch(resolveServiceURL("podcast/generate"), {
    method: "post",
    body: JSON.stringify({ content }),
  });
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
  const audioUrl = URL.createObjectURL(blob);
  return audioUrl;
}
