import { describe, expect, it } from "vitest";
import {
  GYM_LISTING_PHOTO_MAX_BYTES,
  getGymListingPhotoExtension,
  validateGymListingPhotoFile,
} from "./gymListingApi";

describe("gymListingApi photo guards", () => {
  it("accepts only launch-safe image types", () => {
    expect(
      validateGymListingPhotoFile({ type: "image/jpeg", size: 1024 })
    ).toBe("");
    expect(
      validateGymListingPhotoFile({ type: "image/png", size: 1024 })
    ).toBe("");
    expect(
      validateGymListingPhotoFile({ type: "image/webp", size: 1024 })
    ).toBe("");
    expect(
      validateGymListingPhotoFile({ type: "image/svg+xml", size: 1024 })
    ).toMatch(/JPG, PNG, WEBP/);
  });

  it("rejects empty or oversized image files before upload", () => {
    expect(validateGymListingPhotoFile({ type: "image/jpeg", size: 0 })).toMatch(
      /확인/
    );
    expect(
      validateGymListingPhotoFile({
        type: "image/jpeg",
        size: GYM_LISTING_PHOTO_MAX_BYTES + 1,
      })
    ).toMatch(/4MB/);
  });

  it("maps allowed photo MIME types to storage extensions", () => {
    expect(getGymListingPhotoExtension("image/png")).toBe("png");
    expect(getGymListingPhotoExtension("image/webp")).toBe("webp");
    expect(getGymListingPhotoExtension("image/jpeg")).toBe("jpg");
  });
});
