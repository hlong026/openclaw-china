import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  httpPost: vi.fn(),
  httpGet: vi.fn(),
}));

vi.mock("@openclaw-china/shared", async () => {
  const actual = await vi.importActual<typeof import("@openclaw-china/shared")>(
    "@openclaw-china/shared"
  );
  return {
    ...actual,
    httpPost: mocks.httpPost,
    httpGet: mocks.httpGet,
  };
});

import { MediaFileType, clearTokenCache, getAccessToken, uploadC2CMedia } from "./client.js";

describe("getAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokenCache();
  });

  it("coerces numeric appId into string request payload", async () => {
    mocks.httpPost.mockResolvedValue({
      access_token: "token-1",
      expires_in: 7200,
    });

    const token = await getAccessToken(102824485, " secret ");

    expect(token).toBe("token-1");
    expect(mocks.httpPost).toHaveBeenCalledWith(
      "https://bots.qq.com/app/getAppAccessToken",
      { appId: "102824485", clientSecret: "secret" },
      { timeout: 15000 }
    );
  });

  it("rejects empty appId values after trimming", async () => {
    await expect(getAccessToken("  ", "secret")).rejects.toThrow("appId");
    expect(mocks.httpPost).not.toHaveBeenCalled();
  });

  it("includes file_name for FILE uploads", async () => {
    mocks.httpPost.mockResolvedValue({
      file_uuid: "file-1",
      file_info: "info-1",
      ttl: 3600,
    });

    await uploadC2CMedia({
      accessToken: "token-1",
      openid: "user-1",
      fileType: MediaFileType.FILE,
      fileData: "base64-data",
      fileName: "report.pdf",
    });

    expect(mocks.httpPost).toHaveBeenCalledWith(
      "https://api.sgroup.qq.com/v2/users/user-1/files",
      {
        file_type: 4,
        file_data: "base64-data",
        file_name: "report.pdf",
      },
      {
        timeout: 30000,
        headers: {
          Authorization: "QQBot token-1",
        },
      }
    );
  });
});
