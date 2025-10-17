// Mothership Crew Achievements Module
// Adds a crew achievements system to Mothership characters using items

import { AchievementModel } from "./AchievementModel.js";
import { AchievementSheet } from "./AchievementSheet.js";
import {
  askForAutomatePermission,
  getAdjustmentBySkillOrAttribute,
  sendAchievementEffectNotification,
} from "./utils.js";

/* global loadTemplates, DocumentSheetConfig, Item, Handlebars */

let currentRollModifyValue = 0;
let rollEffects = [];
let wantAutomation = 0;
let givenAdvantage = false;
let givenDisadvantage = false;

const resetAutomation = () => {
  currentRollModifyValue = 0;
  rollEffects = [];
  wantAutomation = 0;
  givenAdvantage = false;
  givenDisadvantage = false;
};

const settleRollstring = (newRollString) => {
  const alreadyHasAdvantage = newRollString.includes("[+]");
  const alreadyHasDisadvantage = newRollString.includes("[-]");
  if (alreadyHasAdvantage && givenDisadvantage) {
    newRollString = newRollString.replace("[+]", "");
  } else if (alreadyHasDisadvantage && givenAdvantage) {
    newRollString = newRollString.replace("[-]", "");
  } else if (givenAdvantage && !alreadyHasAdvantage) {
    newRollString = newRollString + " [+]";
  } else if (givenDisadvantage && !alreadyHasDisadvantage) {
    newRollString = newRollString + " [-]";
  }
  return newRollString;
};

import { ACHIEVEMENT_TYPE_ID, MODULE_ID } from "../constants.js";

Hooks.once("setup", () => {
  console.log("Mothership Crew Achievements | Setup Hook");

  // Register the DataModel
  CONFIG.Item.dataModels.achievement = AchievementModel;
  console.log("Registered AchievementModel");
});

Hooks.once("init", async () => {
  console.log(
    game.i18n.localize("MODULE.Initializing") ||
      "Mothership Crew Achievements | Initializing"
  );

  /// CHOOSE SKILL
  const originalChooseSkill = CONFIG.Actor.documentClass.prototype.chooseSkill;
  CONFIG.Actor.documentClass.prototype.chooseSkill = async function (
    dlgTitle,
    rollString
  ) {
    const result = await originalChooseSkill.call(this, dlgTitle, rollString);

    const [modifyValue, newRollEffects] = getAdjustmentBySkillOrAttribute(
      this.items,
      "skill",
      result[1]
    );

    if (newRollEffects?.length > 0 && wantAutomation == 0) {
      const decision = await askForAutomatePermission();
      if (!decision) {
        wantAutomation = -1;
        return result;
      } else {
        wantAutomation = 1;
      }
    } else if (wantAutomation === -1 || newRollEffects.length === 0) {
      return result;
    }

    rollEffects = rollEffects.concat(newRollEffects);

    for (const effect of rollEffects) {
      if (effect.effectType === "advantage") {
        givenAdvantage = true;
      } else if (effect.effectType === "disadvantage") {
        givenDisadvantage = true;
      }
    }

    let newRollString = result[0];

    newRollString = settleRollstring(newRollString);

    const dissectedResult = [
      newRollString, //rollString
      result[1], //skillName (first letter caps)
      (Number(result[2]) + modifyValue).toString(), //skillValue
    ];
    return dissectedResult;
  };

  /// CHOOSE ATTRIBUTE
  const originalChooseAttribute =
    CONFIG.Actor.documentClass.prototype.chooseAttribute;
  CONFIG.Actor.documentClass.prototype.chooseAttribute = async function (
    rollString,
    aimFor
  ) {
    const result = await originalChooseAttribute.call(this, rollString, aimFor);

    const [modifyValue, newRollEffects] = getAdjustmentBySkillOrAttribute(
      this.items,
      "attribute",
      result[2]
    );

    if (newRollEffects?.length > 0 && wantAutomation == 0) {
      const decision = await askForAutomatePermission();
      if (!decision) {
        wantAutomation = -1;
        return result;
      } else {
        wantAutomation = 1;
      }
    } else if (wantAutomation === -1 || newRollEffects.length === 0) {
      return result;
    }

    rollEffects = rollEffects.concat(newRollEffects);

    for (const effect of rollEffects) {
      if (effect.effectType === "advantage") {
        givenAdvantage = true;
      } else if (effect.effectType === "disadvantage") {
        givenDisadvantage = true;
      }
    }

    let newRollString = rollString || "1d100";
    newRollString = settleRollstring(newRollString);

    const dissectedResult = [
      newRollString,
      result[1], // aim ("low","high")
      result[2], //attributeName (lowercase)
    ];
    currentRollModifyValue += modifyValue;
    return dissectedResult;
  };

  /// ROLL CHECK
  const originalRollCheck = CONFIG.Actor.documentClass.prototype.rollCheck;
  CONFIG.Actor.documentClass.prototype.rollCheck = async function (
    rollString,
    aimFor,
    attribute,
    skill,
    skillValue,
    weapon,
    overrideDamageRollString
  ) {
    /** @type {null|'skill'|'attribute'} skillOrAttributeRoll */
    let skillOrAttributeRoll = null;
    if (skill) {
      skillOrAttributeRoll = "skill";
    } else if (attribute) {
      skillOrAttributeRoll = "attribute";
    }

    const [valueToModifyBy, newRollEffects] = getAdjustmentBySkillOrAttribute(
      this.items,
      skillOrAttributeRoll,
      skill || attribute
    );

    currentRollModifyValue += valueToModifyBy;
    rollEffects = rollEffects.concat(newRollEffects);
    let newRollString = rollString;

    if (rollEffects?.length > 0 && wantAutomation == 0) {
      const decision = await askForAutomatePermission();
      if (!decision) {
        resetAutomation();
        wantAutomation = -1;
      } else {
        wantAutomation = 1;
      }
    } else if (wantAutomation === -1) {
      resetAutomation();
      wantAutomation = -1;
    } else if (newRollEffects.length === 0 && wantAutomation === 0) {
      resetAutomation();
    }

    if (wantAutomation == 1) {
      for (const effect of rollEffects) {
        if (effect.effectType === "advantage") {
          givenAdvantage = true;
        } else if (effect.effectType === "disadvantage") {
          givenDisadvantage = true;
        }
      }

      newRollString = newRollString || "1d100";

      newRollString = settleRollstring(newRollString);
    }

    const result = await originalRollCheck.call(
      this,
      newRollString,
      aimFor,
      attribute,
      skill,
      skillValue,
      weapon,
      overrideDamageRollString
    );

    resetAutomation();
    wantAutomation = 0; // Reset after use
    return result;
  };

  /// PREPARE DERIVED DATA
  const originalPrepareDerivedData =
    CONFIG.Actor.documentClass.prototype.prepareDerivedData;
  CONFIG.Actor.documentClass.prototype.prepareDerivedData = function () {
    const result = originalPrepareDerivedData.call(this);
    return result;
  };

  /// ENRICHED ROLL RESULT
  const originalParseRollResult =
    CONFIG.Actor.documentClass.prototype.parseRollResult;
  CONFIG.Actor.documentClass.prototype.parseRollResult = function (
    rollString,
    rollResult,
    zeroBased,
    checkCrit,
    rollTarget,
    comparison,
    specialRoll
  ) {
    let newRollTarget = rollTarget;
    if (wantAutomation > 0) {
      newRollTarget = rollTarget + currentRollModifyValue;
      if (rollEffects.length > 0) {
        sendAchievementEffectNotification(this.name, rollEffects);
      }
    }

    const result = originalParseRollResult.call(
      this,
      rollString,
      rollResult,
      zeroBased,
      checkCrit,
      newRollTarget,
      comparison,
      specialRoll
    );
    return result;
  };

  // TODO: Wait for the System to catch up to modern day.
  // Pretty sure we should be doing this inside the module.json:
  // "documentTypes": {
  //   "Item": {
  //     "achievement": {
  //       "htmlFields": ["description"]
  //     }
  //   }
  // }
  // or maybe in template.json:
  //  {
  //   "Item": {
  //     "types": ["achievement"],
  //     "templates": {},
  //     "achievement": {
  //       "description": "",
  //       "effects": []
  //     }
  //   }
  // }

  Object.assign(game.system.documentTypes.Item, {
    achievement: `${MODULE_ID}.achievement`,
  });
  // Register module setting for roll automation
  game.settings.register(MODULE_ID, "enableRollAutomation", {
    name: game.i18n.localize("SETTINGS.EnableRollAutomation"),
    hint: game.i18n.localize("SETTINGS.EnableRollAutomationHint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false,
  });

  // Register module setting for achievement roll messages
  game.settings.register(MODULE_ID, "enableAchievementMessages", {
    name: game.i18n.localize("SETTINGS.EnableAchievementMessages"),
    hint: game.i18n.localize("SETTINGS.EnableAchievementMessagesHint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false,
  });

  // Register Handlebars helper for equality comparison
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  // Preload templates
  await loadTemplates([`modules/${MODULE_ID}/templates/achievement-sheet.hbs`]);

  // Register the custom item sheet
  DocumentSheetConfig.registerSheet(Item, MODULE_ID, AchievementSheet, {
    types: [`${MODULE_ID}.achievement`],
    makeDefault: true,
  });
});

Hooks.once("ready", async () => {
  console.log(
    game.i18n.localize("MODULE.Ready") || "Mothership Crew Achievements | Ready"
  );

  // Store active tabs for each actor sheet to restore after re-render
  window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER = new Map();
});

// eslint-disable-next-line no-unused-vars
Hooks.on("preCreateItem", (item, data, options, userId) => {
  // Track when items are created on actors to preserve tab state
  if (item.parent?.type === "character" && item.type === ACHIEVEMENT_TYPE_ID) {
    // Find the open sheet for this actor
    const sheet = item.parent.sheet;
    if (sheet?.rendered) {
      const activeTab = sheet.element[0]?.querySelector(
        ".tab.active[data-tab]"
      );
      if (activeTab?.dataset.tab === "achievements") {
        window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER.set(
          sheet.id,
          "achievements"
        );
      }
    }
    return;
  }

  if (item.type !== ACHIEVEMENT_TYPE_ID) {
    return;
  }

  // Set default achievement image.
  item.updateSource({
    img: "modules/mothership-crew-achievements/images/default.webp",
  });
});

// Add achievements tab to character sheets
Hooks.on("renderMothershipActorSheet", (app, html) => {
  // Only for Mothership character sheets
  if (app.actor.type !== "character") return;
  if (!app.actor.hasPlayerOwner) return;
  if (!html[0]?.querySelector) return;

  // Restore previously active tab if it was the achievements tab
  const storedTab = window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER?.get(app.id);
  if (storedTab === "achievements") {
    // Wait for the DOM to be ready, then activate the achievements tab
    setTimeout(() => {
      const achievementsTabLink = html[0].querySelector(
        '[data-tab="achievements"]'
      );
      if (achievementsTabLink) {
        achievementsTabLink.click();
        window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER.delete(app.id); // Clear after restoring
      }
    }, 0);
  }

  // Find the tabs navigation
  const tabsNav = html[0].querySelector('nav[data-group="primary"]');
  if (!tabsNav) return;

  // Add achievements tab to navigation
  const achievementsTab = document.createElement("a");
  achievementsTab.className = "tab-select";
  achievementsTab.dataset.tab = "achievements";
  achievementsTab.innerHTML = `${game.i18n.localize("UI.AchievementsTab") || "Achievements"}`;
  tabsNav.appendChild(achievementsTab);

  // Find the tab content area
  const sheetBody = html[0].querySelector(".sheet-body");
  if (!sheetBody) return;

  // Create achievements tab content
  const achievementsTabContent = document.createElement("div");
  achievementsTabContent.className = "tab achievements-tab";
  achievementsTabContent.dataset.group = "primary";
  achievementsTabContent.dataset.tab = "achievements";

  // Get character's achievement items
  const achievementItems = app.actor.items.filter(
    (item) => item.type === ACHIEVEMENT_TYPE_ID
  );

  // Build achievements display
  let content = `
      <div class="crew-achievements-container">
        <div class="achievements-header">
          <h2>${game.i18n.localize("UI.AchievementsHeader") || "Crewmember Achievements"}</h2>
        </div>
    `;
  if (achievementItems.length > 0) {
    content += '<div class="achievements-grid">';
    achievementItems.forEach((achievement) => {
      const iconHtml = achievement.img
        ? `<img src="${achievement.img}" alt="${achievement.name}" />`
        : '<i class="fas fa-trophy"></i>';

      content += `
          <div class="achievement-card" data-item-id="${achievement.id}">
            <div class="achievement-icon">${iconHtml}</div>
            <div class="achievement-content">
              <h3 class="achievement-name">${achievement.name}</h3>
              <p class="achievement-description">${achievement.system.description || ""}</p>
        `;

      // Display effects if any
      // Convert to array if it's an object (Foundry sometimes does this)
      const effectsArray = Array.isArray(achievement.system.effects)
        ? achievement.system.effects
        : Object.values(achievement.system.effects);
      const effects = achievement.system.effects ? effectsArray : [];

      if (effects.length > 0) {
        content += `
            <div class="achievement-effects">
              <strong>${game.i18n.localize("UI.AchievementEffects") || "Effects"}:</strong>
              <ul>
          `;
        effects.forEach((effect) => {
          let effectText = "";
          let effectClass = "";

          switch (effect.effectType) {
            case "statMod":
              if (
                effect.stat &&
                effect.bonus !== null &&
                effect.bonus !== undefined
              ) {
                const statName =
                  game.i18n.localize(
                    `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
                  ) || effect.stat;
                const bonus =
                  effect.bonus > 0 ? `+${effect.bonus}` : effect.bonus;
                effectText = `${bonus} to ${statName}`;
                effectClass =
                  effect.bonus >= 0 ? "positive-effect" : "negative-effect";
              }
              break;

            case "skillMod":
              if (
                effect.skill &&
                effect.bonus !== null &&
                effect.bonus !== undefined
              ) {
                const skillName = effect.skill;
                const bonus =
                  effect.bonus > 0 ? `+${effect.bonus}` : effect.bonus;
                effectText = `${bonus} to ${skillName}`;
                effectClass =
                  effect.bonus >= 0 ? "positive-effect" : "negative-effect";
              }
              break;

            case "advantage":
              if (effect.stat) {
                const statName =
                  game.i18n.localize(
                    `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
                  ) || effect.stat;
                effectText = `Advantage on ${statName} checks`;
                effectClass = "positive-effect";
              } else if (effect.skill) {
                const skillName = effect.skill;
                effectText = `Advantage on ${skillName} checks`;
                effectClass = "positive-effect";
              } else {
                effectText = "Advantage";
                effectClass = "positive-effect";
              }
              break;

            case "disadvantage":
              if (effect.stat) {
                const statName =
                  game.i18n.localize(
                    `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
                  ) || effect.stat;
                effectText = `Disadvantage on ${statName} checks`;
                effectClass = "negative-effect";
              } else if (effect.skill) {
                const skillName = effect.skill;
                effectText = `Disadvantage on ${skillName} checks`;
                effectClass = "negative-effect";
              } else {
                effectText = "Disadvantage";
                effectClass = "negative-effect";
              }
              break;

            case "custom":
              effectText = effect.customDescription || "Custom effect";
              effectClass = "custom-effect";
              break;

            default:
              effectText = "Unknown effect";
          }

          if (effectText) {
            content += `<li class="${effectClass}">${effectText}</li>`;
          }
        });
        content += "</ul></div>";
      }

      content += `
            </div>
        `;

      // Only show action buttons for GM
      if (game.user.isGM) {
        content += `
            <div class="achievement-actions">
              <button class="view-achievement-btn" data-item-id="${achievement.id}" title="${game.i18n.localize("UI.ViewAchievement") || "View Achievement"}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="delete-achievement-btn" data-item-id="${achievement.id}" title="${game.i18n.localize("UI.DeleteAchievement") || "Delete Achievement"}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;
      }

      content += `
          </div>
        `;
    });
    content += "</div>";
  } else {
    content += `
        <div class="achievements-empty">
          <p>${game.i18n.localize("UI.NoAchievements") || "No achievements yet."}</p>
      `;

    if (game.user.isGM) {
      content += `<p>${game.i18n.localize("UI.DropAchievementsHere") || "Create achievement items and drag them here to award them!"}</p>`;
    } else {
      content += `<p>${game.i18n.localize("UI.EarnSomeAchievements") || "Complete missions and impress the GM to earn achievements!"}</p>`;
    }

    content += `
        </div>
      `;
  }

  content += "</div>";
  achievementsTabContent.innerHTML = content;
  sheetBody.appendChild(achievementsTabContent);

  // Add event listeners for view buttons
  achievementsTabContent
    .querySelectorAll(".view-achievement-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Track tab state in case viewing causes a re-render
        const activeTab = html[0].querySelector(".tab.active[data-tab]");
        if (activeTab?.dataset.tab === "achievements") {
          window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER.set(
            app.id,
            "achievements"
          );
        }

        const itemId = e.currentTarget.dataset.itemId;
        const item = app.actor.items.get(itemId);
        if (item) item.sheet.render(true);
      });
    });

  // Add event listeners for delete buttons
  achievementsTabContent
    .querySelectorAll(".delete-achievement-btn")
    .forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const itemId = e.currentTarget.dataset.itemId;
        const item = app.actor.items.get(itemId);
        if (item) {
          const confirm = await foundry.applications.api.DialogV2.confirm({
            title: game.i18n.localize("UI.DeleteAchievement"),
            content: `<p>${game.i18n.localize("UI.ConfirmDeleteAchievement") || "Are you sure you want to remove this achievement?"}</p>`,
          });
          if (confirm) {
            // Track that we're on the achievements tab before deletion triggers a re-render
            const activeTab = html[0].querySelector(".tab.active[data-tab]");
            if (activeTab?.dataset.tab === "achievements") {
              window.MOSH_ACHIEVEMENTS_ACTIVE_TAB_TRACKER.set(
                app.id,
                "achievements"
              );
            }

            await item.delete();
          }
        }
      });
    });
});

// Add chat message when an achievement is added to a character
Hooks.on("createItem", (item) => {
  if (item.type === ACHIEVEMENT_TYPE_ID && item.parent?.type === "character") {
    const actor = item.parent;

    ChatMessage.create({
      content: `
          <div class="achievement-notification">
            <div class="achievement-title-banner">
              <div class="achievement-notification-title">Achievement Check</div>
              <img src="${item.img}" alt="${item.name}" class="achievement-notification-icon"/>
            </div>
            <div class="achievement-content">
              <div class="achievement-content-line">
                CREWMEMBER: <strong>${actor.name}</strong>
              </div>
              <div class="achievement-content-line">
                ACHIEVEMENT: <strong>${item.name}</strong>
              </div>
              <div class="achievement-content-line">
                REASON: <strong>${item.system.description || "No description provided."}</strong>
              </div>
              <div class="achievement-stamp-container">
                <div class="achievement-approved-stamp">
                  APPROVED
                </div>
              </div>
            </div>
          </div>
        `,
      speaker: { alias: "Achievement System" },
    });
  }
});
