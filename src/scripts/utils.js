import { ACHIEVEMENT_TYPE_ID, MODULE_ID } from "../constants.js";

export const capitalizeWord = (word) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const getAdjustmentBySkillOrAttribute = (
  achievements,
  skillOrAttributeRoll,
  value
) => {
  let currentRollModifyValue = 0;
  let rollEffects = [];

  if (!achievements || achievements.length === 0 || !value) {
    return [0, []];
  }

  // Filter achievements to those that have relevant effects

  const applicableAchievements = achievements.filter((item) => {
    if (item.type !== ACHIEVEMENT_TYPE_ID) return false;
    const effects = item.system.effects;
    if (!effects || effects.length === 0) return false;
    return effects.some((effect) => {
      if (
        effect.effectType === "statMod" &&
        skillOrAttributeRoll === "attribute"
      ) {
        return effect.stat === value.toLowerCase();
      }
      if (
        effect.effectType === "skillMod" &&
        skillOrAttributeRoll === "skill"
      ) {
        return effect.skill === value;
      }
      if (effect.effectType === "advantage") {
        if (skillOrAttributeRoll === "attribute") {
          return effect.stat === value.toLowerCase();
        } else if (skillOrAttributeRoll === "skill") {
          return effect.skill === value;
        }
      }
      if (effect.effectType === "disadvantage") {
        if (skillOrAttributeRoll === "attribute") {
          return effect.stat === value.toLowerCase();
        } else if (skillOrAttributeRoll === "skill") {
          return effect.skill === value;
        }
      }
      return false;
    });
  });

  for (const achievement of applicableAchievements) {
    const effects = achievement.system.effects;
    if (!effects || effects.length === 0) continue;

    for (const effect of effects) {
      if (
        effect.effectType === "statMod" &&
        skillOrAttributeRoll === "attribute" &&
        effect.stat === value.toLowerCase() &&
        typeof effect.bonus === "number"
      ) {
        currentRollModifyValue += effect.bonus;
        rollEffects.push(effect);
      } else if (
        effect.effectType === "skillMod" &&
        skillOrAttributeRoll === "skill" &&
        effect.skill === value &&
        typeof effect.bonus === "number"
      ) {
        currentRollModifyValue += effect.bonus;
        rollEffects.push(effect);
      } else if (effect.effectType === "advantage") {
        if (skillOrAttributeRoll === "skill" && effect.skill === value) {
          rollEffects.push(effect);
        } else if (
          skillOrAttributeRoll === "attribute" &&
          effect.stat === value.toLowerCase()
        ) {
          rollEffects.push(effect);
        }
      } else if (effect.effectType === "disadvantage") {
        if (skillOrAttributeRoll === "skill" && effect.skill === value) {
          rollEffects.push(effect);
        } else if (
          skillOrAttributeRoll === "attribute" &&
          effect.stat === value.toLowerCase()
        ) {
          rollEffects.push(effect);
        }
      }
      // Ignore other effect types (advantage, disadvantage, custom)
    }
  }

  return [currentRollModifyValue, rollEffects];
};

export const getEffectChatText = (effect) => {
  switch (effect.effectType) {
    case "statMod":
      return game.i18n.format("CHAT.StatModEffect", {
        bonus: effect.bonus > 0 ? `+${effect.bonus}` : effect.bonus,
        stat: game.i18n.localize(
          `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
        ),
      });
    case "skillMod":
      return game.i18n.format("CHAT.SkillModEffect", {
        bonus: effect.bonus > 0 ? `+${effect.bonus}` : effect.bonus,
        skill: effect.skill,
      });
    case "advantage":
      if (effect.stat) {
        return game.i18n.format("CHAT.AdvantageOnStat", {
          stat: game.i18n.localize(
            `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
          ),
        });
      } else if (effect.skill) {
        return game.i18n.format("CHAT.AdvantageOnSkill", {
          skill: effect.skill,
        });
      } else {
        return game.i18n.localize("CHAT.Advantage");
      }
    case "disadvantage":
      if (effect.stat) {
        return game.i18n.format("CHAT.DisadvantageOnStat", {
          stat: game.i18n.localize(
            `Mosh.${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`
          ),
        });
      } else if (effect.skill) {
        return game.i18n.format("CHAT.DisadvantageOnSkill", {
          skill: effect.skill,
        });
      } else {
        return game.i18n.localize("CHAT.Disadvantage");
      }
    case "cancellation":
      return game.i18n.localize("CHAT.AdvantageDisadvantageCanceled");
  }
};

// Helper function to send achievement effect notifications to chat
export function sendAchievementEffectNotification(actorName, effects) {
  // Check if roll automation is enabled
  const automationEnabled = game.settings.get(
    MODULE_ID,
    "enableRollAutomation"
  );
  // Check if achievement roll messages are enabled
  const messagesEnabled = game.settings.get(
    MODULE_ID,
    "enableAchievementMessages"
  );
  if (!automationEnabled || !messagesEnabled) {
    return;
  }

  if (!effects || effects.length === 0) {
    return;
  }

  const effectsList = effects
    .map((effect) => {
      const effectText = getEffectChatText(effect);
      return effectText ? `<li>${effectText}</li>` : "";
    })
    .filter((text) => text)
    .join("");

  if (effectsList) {
    ChatMessage.create({
      content: `
        <div style="text-align: center; font-style: italic; color: #333; margin: 0.5em 0;">
          <strong>${game.i18n.format("CHAT.AchievementEffectsApplied", { character: actorName })}</strong>
          <ul style="list-style: none; padding: 0; margin: 0.25em 0;">
            ${effectsList}
          </ul>
        </div>
      `,
      speaker: { alias: game.i18n.localize("CHAT.AchievementSystem") },
      // whisper: [game.user.id],
    });
  }
}

export const askForAutomatePermission = async () => {
  let decision = await foundry.applications.api.DialogV2.confirm({
    content:
      "<p>You have one or more achievements that modify your selection.<br/>Would you like to apply achievement effects to this roll?</p>",
    rejectClose: false,
    modal: true,
    ok: {
      label: "Yes",
    },
  });
  return decision;
};
