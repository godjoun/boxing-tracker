import { describe, expect, it } from "vitest";
import { updateMySparringRounds, joinGymExchange } from "../api/gymExchangeParticipationApi";

describe("gymExchangeParticipationApi client guards", () => {
  it("rejects negative rounds before network", async () => {
    await expect(updateMySparringRounds("evt", -1)).rejects.toThrow(
      /0 이상/
    );
  });

  it("rejects empty nickname before network", async () => {
    await expect(joinGymExchange("evt", "  ", "Gym")).rejects.toThrow(
      /닉네임/
    );
  });
});
