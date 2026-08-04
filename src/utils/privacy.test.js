import { describe, expect, it } from "vitest";
import {
  sanitizeProfileForBackup,
  sanitizeProfileForStorage,
} from "./privacy";

describe("profile photo privacy", () => {
  it("keeps safe local home photos and rejects remote URLs", () => {
    expect(
      sanitizeProfileForStorage({
        homeHeroPhoto: "data:image/jpeg;base64,abc",
      }).homeHeroPhoto
    ).toBe("data:image/jpeg;base64,abc");

    expect(
      sanitizeProfileForStorage({
        homeHeroPhoto: "https://example.com/tracker.jpg",
      }).homeHeroPhoto
    ).toBe("");
  });

  it("excludes profile and home photos from backups", () => {
    const backup = sanitizeProfileForBackup({
      nickname: "MANTLE",
      photo: "data:image/jpeg;base64,avatar",
      homeHeroPhoto: "data:image/jpeg;base64,hero",
    });

    expect(backup).toEqual({ nickname: "MANTLE" });
  });
});
