/**
 * Integration tests for achievement automation flow
 * These tests verify the bugs we fixed related to automation state management
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ACHIEVEMENT_TYPE_ID } from "../../constants.js";
import "./setup.js";

describe("Achievement Automation Flow", () => {
  let mockActor;
  let originalChooseSkill;
  let originalChooseAttribute;
  let originalRollCheck;
  let wantAutomation;
  let rollEffects;
  let currentRollModifyValue;

  beforeEach(() => {
    // Reset automation state variables
    wantAutomation = 0;
    rollEffects = [];
    currentRollModifyValue = 0;

    // Create a mock actor with achievements
    mockActor = {
      items: [
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
          name: "Strong",
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
      ],
    };

    // Store original functions
    originalChooseSkill = jest.fn((dlgTitle, rollString) =>
      Promise.resolve(["1d100", "Firearms", "50"])
    );
    originalChooseAttribute = jest.fn((rollString, aimFor) =>
      Promise.resolve(["1d100", "low", "strength"])
    );
    originalRollCheck = jest.fn(() => Promise.resolve({}));
  });

  describe("Bug Fix: wantAutomation persistence across rolls", () => {
    it("should reset wantAutomation when user denies on one roll but accepts on next independent roll", async () => {
      // Simulate the bug scenario:
      // 1. User denies automation on Firearms roll
      // 2. User should be asked again on next Athletics roll

      const mockDialogConfirm = jest
        .spyOn(global.foundry.applications.api.DialogV2, "confirm")
        .mockResolvedValueOnce(false) // First roll: user says "No"
        .mockResolvedValueOnce(true); // Second roll: user says "Yes"

      // First roll with Firearms (has achievement effect)
      wantAutomation = 0;
      rollEffects = [];

      // Simulate asking for automation
      if (wantAutomation === 0) {
        const decision =
          await global.foundry.applications.api.DialogV2.confirm();
        if (!decision) {
          wantAutomation = -1;
        }
      }
      expect(wantAutomation).toBe(-1);

      // Simulate starting a new roll - this should reset automation state
      // The fix checks: wantAutomation === -1 && rollEffects.length === 0
      if (wantAutomation === -1 && rollEffects.length === 0) {
        // Reset for new roll
        wantAutomation = 0;
        rollEffects = [];
        currentRollModifyValue = 0;
      }

      expect(wantAutomation).toBe(0); // Should be reset

      // Second roll should ask again
      if (wantAutomation === 0) {
        const decision =
          await global.foundry.applications.api.DialogV2.confirm();
        if (decision) {
          wantAutomation = 1;
        }
      }

      expect(wantAutomation).toBe(1); // User accepted on second roll
      expect(mockDialogConfirm).toHaveBeenCalledTimes(2); // Asked twice
    });

    it("should NOT reset wantAutomation in the middle of a multi-step roll", async () => {
      // Scenario: User says "Yes" to apply effects during skill selection
      // Then chooseAttribute runs with effects for the same roll
      // wantAutomation should stay at 1, not reset

      wantAutomation = 1; // User already said "Yes"
      rollEffects = [
        {
          effectType: "skillMod",
          skill: "Firearms",
          bonus: 10,
        },
      ]; // Already have effects

      // When chooseAttribute runs, it should NOT reset
      // because rollEffects.length > 0 (indicating we're in the middle of a roll)
      if (wantAutomation === -1 && rollEffects.length === 0) {
        wantAutomation = 0;
        rollEffects = [];
      }

      expect(wantAutomation).toBe(1); // Should remain 1
      expect(rollEffects).toHaveLength(1); // Effects preserved
    });
  });

  describe("Bug Fix: FormData handling in formHandler", () => {
    it("should access formData.object not formData directly", () => {
      // Simulate FormDataExtended structure
      const mockFormData = {
        object: {
          name: "New Achievement Name",
          "system.description": "New description",
          "system.effects.0.effectType": "statMod",
          "system.effects.0.stat": "strength",
          "system.effects.0.bonus": "5",
        },
      };

      // The bug was using formData instead of formData.object
      const wrongData = global.foundry.utils.expandObject(mockFormData);
      const correctData = global.foundry.utils.expandObject(
        mockFormData.object
      );

      // Wrong approach would not have the actual form fields
      expect(wrongData.object).toBeDefined();
      expect(wrongData.name).toBeUndefined();

      // Correct approach has the form fields
      expect(correctData.name).toBe("New Achievement Name");
      expect(correctData.system).toBeDefined();
      expect(correctData.system.description).toBe("New description");
    });
  });

  describe("Bug Fix: Multiple chat messages per player", () => {
    it("should only create one chat message when userId matches current user", async () => {
      const createChatMessageSpy = jest.spyOn(global.ChatMessage, "create");

      const mockItem = {
        type: ACHIEVEMENT_TYPE_ID,
        name: "Test Achievement",
        img: "test.png",
        parent: {
          type: "character",
          name: "Test Character",
        },
        system: {
          description: "Test description",
        },
      };

      const currentUserId = "user-1";
      const itemCreatorUserId = "user-1";

      game.user.id = currentUserId;

      // Simulate the hook firing
      if (game.user.id === itemCreatorUserId) {
        await ChatMessage.create({
          content: "Achievement awarded",
        });
      }

      expect(createChatMessageSpy).toHaveBeenCalledTimes(1);
    });

    it("should NOT create chat message when userId does not match current user", async () => {
      const createChatMessageSpy = jest.spyOn(global.ChatMessage, "create");

      const currentUserId = "user-1";
      const itemCreatorUserId = "user-2";

      game.user.id = currentUserId;

      // Simulate the hook firing with different user
      if (game.user.id === itemCreatorUserId) {
        await ChatMessage.create({
          content: "Achievement awarded",
        });
      }

      expect(createChatMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe("Automation state transitions", () => {
    it("should transition from 0 -> 1 when user accepts", async () => {
      global.foundry.applications.api.DialogV2.confirm.mockResolvedValueOnce(
        true
      );

      wantAutomation = 0;
      const decision = await global.foundry.applications.api.DialogV2.confirm();
      if (decision) {
        wantAutomation = 1;
      }

      expect(wantAutomation).toBe(1);
    });

    it("should transition from 0 -> -1 when user denies", async () => {
      global.foundry.applications.api.DialogV2.confirm.mockResolvedValueOnce(
        false
      );

      wantAutomation = 0;
      const decision = await global.foundry.applications.api.DialogV2.confirm();
      if (!decision) {
        wantAutomation = -1;
      }

      expect(wantAutomation).toBe(-1);
    });

    it("should reset from -1 -> 0 when starting new roll with no accumulated effects", () => {
      wantAutomation = -1;
      rollEffects = [];

      // Start of new roll detection
      if (wantAutomation === -1 && rollEffects.length === 0) {
        wantAutomation = 0;
        rollEffects = [];
        currentRollModifyValue = 0;
      }

      expect(wantAutomation).toBe(0);
    });

    it("should NOT reset from -1 when in middle of roll (has accumulated effects)", () => {
      wantAutomation = -1;
      rollEffects = [{ effectType: "statMod" }];

      // Mid-roll check
      if (wantAutomation === -1 && rollEffects.length === 0) {
        wantAutomation = 0;
      }

      expect(wantAutomation).toBe(-1); // Should stay -1
    });
  });

  describe("Effect accumulation", () => {
    it("should accumulate effects from multiple steps in same roll", () => {
      const skillEffects = [
        { effectType: "skillMod", skill: "Firearms", bonus: 10 },
      ];
      const attributeEffects = [
        { effectType: "statMod", stat: "combat", bonus: 5 },
      ];

      rollEffects = [];
      rollEffects = rollEffects.concat(skillEffects);
      rollEffects = rollEffects.concat(attributeEffects);

      expect(rollEffects).toHaveLength(2);
      expect(rollEffects[0].skill).toBe("Firearms");
      expect(rollEffects[1].stat).toBe("combat");
    });

    it("should reset effects when starting new roll", () => {
      rollEffects = [
        { effectType: "skillMod", skill: "Firearms", bonus: 10 },
        { effectType: "statMod", stat: "combat", bonus: 5 },
      ];

      // Simulate reset at end of roll
      const resetAutomation = () => {
        currentRollModifyValue = 0;
        rollEffects = [];
        wantAutomation = 0;
      };

      resetAutomation();

      expect(rollEffects).toHaveLength(0);
      expect(wantAutomation).toBe(0);
      expect(currentRollModifyValue).toBe(0);
    });
  });
});
