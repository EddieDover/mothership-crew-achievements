/**
 * Unit tests for utility functions
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { ACHIEVEMENT_TYPE_ID } from "../../constants.js";
import {
  askForAutomatePermission,
  capitalizeWord,
  getAdjustmentBySkillOrAttribute,
  getEffectChatText,
  sendAchievementEffectNotification,
} from "../utils.js";

// Import test setup
import "./setup.js";

describe("capitalizeWord", () => {
  it("should capitalize the first letter of a word", () => {
    expect(capitalizeWord("hello")).toBe("Hello");
    expect(capitalizeWord("world")).toBe("World");
    expect(capitalizeWord("test")).toBe("Test");
  });

  it("should handle single character strings", () => {
    expect(capitalizeWord("a")).toBe("A");
  });

  it("should handle already capitalized words", () => {
    expect(capitalizeWord("Hello")).toBe("Hello");
  });
});

describe("getAdjustmentBySkillOrAttribute", () => {
  let mockAchievements;

  beforeEach(() => {
    // Create mock achievements with various effects
    mockAchievements = [
      {
        type: ACHIEVEMENT_TYPE_ID,
        name: "Strength Training",
        system: {
          effects: [
            {
              effectType: "statMod",
              stat: "strength",
              bonus: 5,
            },
          ],
        },
      },
      {
        type: ACHIEVEMENT_TYPE_ID,
        name: "Firearms Expert",
        system: {
          effects: [
            {
              effectType: "skillMod",
              skill: "Firearms",
              bonus: 10,
            },
          ],
        },
      },
      {
        type: ACHIEVEMENT_TYPE_ID,
        name: "Combat Advantage",
        system: {
          effects: [
            {
              effectType: "advantage",
              stat: "combat",
            },
          ],
        },
      },
      {
        type: ACHIEVEMENT_TYPE_ID,
        name: "Clumsy",
        system: {
          effects: [
            {
              effectType: "disadvantage",
              skill: "Athletics",
            },
          ],
        },
      },
    ];
  });

  describe("Attribute rolls", () => {
    it("should return correct bonus for matching stat", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "attribute",
        "strength"
      );
      expect(bonus).toBe(5);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("statMod");
    });

    it("should return 0 bonus for non-matching stat", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "attribute",
        "speed"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should return advantage effect for matching stat", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "attribute",
        "combat"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("advantage");
    });

    it("should return advantage effect for matching attribute with skill type", () => {
      const achievementsWithAdvantage = [
        {
          type: ACHIEVEMENT_TYPE_ID,
          name: "Skilled Fighter",
          system: {
            effects: [
              {
                effectType: "advantage",
                skill: "Combat",
              },
            ],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        achievementsWithAdvantage,
        "skill",
        "Combat"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("advantage");
    });

    it("should handle case-insensitive stat matching", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "attribute",
        "Strength"
      );
      expect(bonus).toBe(5);
      expect(effects).toHaveLength(1);
    });
  });

  describe("Skill rolls", () => {
    it("should return correct bonus for matching skill", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "skill",
        "Firearms"
      );
      expect(bonus).toBe(10);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("skillMod");
    });

    it("should return 0 bonus for non-matching skill", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "skill",
        "Medicine"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should return disadvantage effect for matching skill", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "skill",
        "Athletics"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("disadvantage");
    });

    it("should return disadvantage effect for matching attribute", () => {
      const achievementsWithDisadvantage = [
        {
          type: ACHIEVEMENT_TYPE_ID,
          name: "Clumsy",
          system: {
            effects: [
              {
                effectType: "disadvantage",
                stat: "speed",
              },
            ],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        achievementsWithDisadvantage,
        "attribute",
        "speed"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(1);
      expect(effects[0].effectType).toBe("disadvantage");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty achievements array", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        [],
        "skill",
        "Firearms"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should handle null achievements", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        null,
        "skill",
        "Firearms"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should handle undefined value", () => {
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mockAchievements,
        "skill",
        undefined
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should handle achievements with no effects", () => {
      const achievementsNoEffects = [
        {
          type: ACHIEVEMENT_TYPE_ID,
          name: "No Effects",
          system: {
            effects: [],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        achievementsNoEffects,
        "skill",
        "Firearms"
      );
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should filter out non-achievement items", () => {
      const mixedItems = [
        {
          type: "weapon", // Not an achievement
          name: "Sword",
          system: {
            effects: [{ effectType: "statMod", stat: "strength", bonus: 10 }],
          },
        },
        {
          type: ACHIEVEMENT_TYPE_ID,
          name: "Real Achievement",
          system: {
            effects: [{ effectType: "statMod", stat: "strength", bonus: 5 }],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        mixedItems,
        "attribute",
        "strength"
      );
      expect(bonus).toBe(5); // Only the achievement bonus
      expect(effects).toHaveLength(1);
    });

    it("should handle advantage/disadvantage with neither stat nor skill", () => {
      const achievementsWithGeneric = [
        {
          type: ACHIEVEMENT_TYPE_ID,
          name: "Generic Advantage",
          system: {
            effects: [
              {
                effectType: "advantage",
                // No stat or skill specified
              },
            ],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        achievementsWithGeneric,
        "skill",
        "Firearms"
      );
      // Generic advantage without stat/skill shouldn't match
      expect(bonus).toBe(0);
      expect(effects).toHaveLength(0);
    });

    it("should accumulate multiple bonuses from different achievements", () => {
      const multipleAchievements = [
        {
          type: ACHIEVEMENT_TYPE_ID,
          system: {
            effects: [{ effectType: "statMod", stat: "strength", bonus: 5 }],
          },
        },
        {
          type: ACHIEVEMENT_TYPE_ID,
          system: {
            effects: [{ effectType: "statMod", stat: "strength", bonus: 3 }],
          },
        },
      ];
      const [bonus, effects] = getAdjustmentBySkillOrAttribute(
        multipleAchievements,
        "attribute",
        "strength"
      );
      expect(bonus).toBe(8);
      expect(effects).toHaveLength(2);
    });
  });
});

describe("getEffectChatText", () => {
  beforeEach(() => {
    // Reset the mock before each test
    game.i18n.format.mockClear();
    game.i18n.localize.mockClear();
  });

  it("should format statMod effect with positive bonus", () => {
    const effect = {
      effectType: "statMod",
      stat: "strength",
      bonus: 5,
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.StatModEffect",
      expect.objectContaining({
        bonus: "+5",
        stat: "Mosh.Strength",
      })
    );
  });

  it("should format statMod effect with negative bonus", () => {
    const effect = {
      effectType: "statMod",
      stat: "speed",
      bonus: -3,
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.StatModEffect",
      expect.objectContaining({
        bonus: -3,
        stat: "Mosh.Speed",
      })
    );
  });

  it("should format skillMod effect", () => {
    const effect = {
      effectType: "skillMod",
      skill: "Firearms",
      bonus: 10,
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.SkillModEffect",
      expect.objectContaining({
        bonus: "+10",
        skill: "Firearms",
      })
    );
  });

  it("should format advantage on stat", () => {
    const effect = {
      effectType: "advantage",
      stat: "combat",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.AdvantageOnStat",
      expect.objectContaining({
        stat: "Mosh.Combat",
      })
    );
  });

  it("should format advantage on skill", () => {
    const effect = {
      effectType: "advantage",
      skill: "Athletics",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.AdvantageOnSkill",
      expect.objectContaining({
        skill: "Athletics",
      })
    );
  });

  it("should format disadvantage on stat", () => {
    const effect = {
      effectType: "disadvantage",
      stat: "intellect",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.DisadvantageOnStat",
      expect.objectContaining({
        stat: "Mosh.Intellect",
      })
    );
  });

  it("should format disadvantage on skill", () => {
    const effect = {
      effectType: "disadvantage",
      skill: "Medicine",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.DisadvantageOnSkill",
      expect.objectContaining({
        skill: "Medicine",
      })
    );
  });

  it("should format cancellation effect", () => {
    const effect = {
      effectType: "cancellation",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.localize).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.AdvantageDisadvantageCanceled"
    );
  });

  it("should format advantage with no stat or skill specified", () => {
    const effect = {
      effectType: "advantage",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.localize).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.Advantage"
    );
  });

  it("should format disadvantage with no stat or skill specified", () => {
    const effect = {
      effectType: "disadvantage",
    };
    const result = getEffectChatText(effect);
    expect(game.i18n.localize).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.Disadvantage"
    );
  });
});

describe("sendAchievementEffectNotification", () => {
  beforeEach(() => {
    globalThis.ChatMessage.create.mockClear();
    game.settings.get.mockClear();
  });

  it("should create chat message with effects list", () => {
    game.settings.get.mockReturnValue(true); // Both settings enabled

    const effects = [
      { effectType: "statMod", stat: "strength", bonus: 5 },
      { effectType: "advantage", stat: "combat" },
    ];

    sendAchievementEffectNotification("Test Character", effects);

    expect(globalThis.ChatMessage.create).toHaveBeenCalledTimes(1);
    expect(globalThis.ChatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.any(String),
        speaker: expect.objectContaining({
          alias: expect.any(String),
        }),
      })
    );

    // Verify the function was called with the character name
    expect(game.i18n.format).toHaveBeenCalledWith(
      "mothership-crew-achievements.CHAT.AchievementEffectsApplied",
      { character: "Test Character" }
    );
  });

  it("should not create message if automation disabled", () => {
    game.settings.get.mockImplementation((module, setting) => {
      if (setting === "enableRollAutomation") return false;
      if (setting === "enableAchievementMessages") return true;
      return null;
    });

    const effects = [{ effectType: "statMod", stat: "strength", bonus: 5 }];
    sendAchievementEffectNotification("Test Character", effects);

    expect(globalThis.ChatMessage.create).not.toHaveBeenCalled();
  });

  it("should not create message if achievement messages disabled", () => {
    game.settings.get.mockImplementation((module, setting) => {
      if (setting === "enableRollAutomation") return true;
      if (setting === "enableAchievementMessages") return false;
      return null;
    });

    const effects = [{ effectType: "statMod", stat: "strength", bonus: 5 }];
    sendAchievementEffectNotification("Test Character", effects);

    expect(globalThis.ChatMessage.create).not.toHaveBeenCalled();
  });

  it("should not create message if effects array is empty", () => {
    game.settings.get.mockReturnValue(true);

    sendAchievementEffectNotification("Test Character", []);

    expect(globalThis.ChatMessage.create).not.toHaveBeenCalled();
  });

  it("should not create message if effects is null", () => {
    game.settings.get.mockReturnValue(true);

    sendAchievementEffectNotification("Test Character", null);

    expect(globalThis.ChatMessage.create).not.toHaveBeenCalled();
  });
});

describe("askForAutomatePermission", () => {
  it("should return dialog result", async () => {
    globalThis.foundry.applications.api.DialogV2.confirm.mockResolvedValueOnce(
      true
    );

    const result = await askForAutomatePermission();

    expect(result).toBe(true);
    expect(
      globalThis.foundry.applications.api.DialogV2.confirm
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("achievement"),
        rejectClose: false,
        modal: true,
      })
    );
  });

  it("should return false when user declines", async () => {
    globalThis.foundry.applications.api.DialogV2.confirm.mockResolvedValueOnce(
      false
    );

    const result = await askForAutomatePermission();

    expect(result).toBe(false);
  });
});
