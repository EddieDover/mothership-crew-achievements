import { capitalizeWord } from "./utils.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class AchievementSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: AchievementSheet.formHandler,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      title: "mothership-crew-achievements.UI.AchievementSheet",
      width: 520,
      height: 480,
    },
    classes: ["mosh", "sheet", "item", "mosh-achievement"],
    actions: {
      onAddEffect: AchievementSheet.onAddEffect,
      onDeleteEffect: AchievementSheet.onDeleteEffect,
      editDescription: AchievementSheet.editDescription,
    },
  };

  static PARTS = {
    form: {
      template:
        "modules/mothership-crew-achievements/templates/achievement-sheet.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template:
        "modules/mothership-crew-achievements/templates/partials/description-tab.hbs",
      scrollable: [""],
    },
    effects: {
      template:
        "modules/mothership-crew-achievements/templates/partials/effects-tab.hbs",
      scrollable: [""],
    },
  };

  static TABS = {
    primary: {
      tabs: [{ id: "description" }, { id: "effects" }],
      labelPrefix: "mothership-crew-achievements.UI.Tab",
      initial: "description",
    },
  };

  static async formHandler(event, form, formData) {
    // Convert the flat formData structure back to nested arrays for effects
    const expandedData = foundry.utils.expandObject(formData.object);
    // Ensure effects is an array
    if (expandedData.system?.effects) {
      expandedData.system.effects = Object.values(expandedData.system.effects);
    }

    const result = await this.document.update(expandedData);
    // Force re-render after document update to ensure UI reflects changes
    this.render(false);

    return result;
  }

  constructor(...args) {
    super(...args);
    this.currentItem = { ...args }[0].document;
    this.isDataLoaded = false;
    this.v12StatKeys = [];
    this.v12StatValues = [];
    this.v12SkillKeys = [];
    this.v12SkillValues = [];
  }

  async loadData() {
    // TODO: Wait for the System to catch up to modern day.
    // this.v14keys = game.system.documentTypes.Actor.character.stats;
    this.v12StatKeys = Object.keys(game.system.template.Actor.character.stats);
    this.v12StatValues = this.v12StatKeys.map((key) => {
      return {
        value: key, // Use the key itself as the value, not the stat object
        label: `Mosh.${capitalizeWord(key)}`,
      };
    });
    const localizeSkill = game.i18n
      .localize("mothership-crew-achievements.SKILL")
      .toLowerCase();

    // Get skill packs in localized language first
    let skillPacks = game.packs
      .filter(
        (p) =>
          p.metadata.type === "Item" &&
          p.metadata.label.toLowerCase().includes(localizeSkill)
      )
      .map((p) => p.metadata.id);

    // Fallback to English if no localized skill packs found
    if (skillPacks.length === 0) {
      skillPacks = game.packs
        .filter(
          (p) =>
            p.metadata.type === "Item" &&
            p.metadata.name.toLowerCase().includes("skill")
        )
        .map((p) => p.metadata.id);
    }

    this.v12SkillKeys = [];
    this.v12SkillValues = [];

    for (const packId of skillPacks) {
      const pack = await game.packs.get(packId);
      if (!pack) continue;
      const skills = await pack.getDocuments();
      for (const sk of skills) {
        if (!this.v12SkillKeys.includes(sk.name)) {
          this.v12SkillKeys.push(sk.name);
          this.v12SkillValues.push({
            value: sk.name,
            label: sk.name,
          });
        }
      }
    }

    const playerMadeSkills = game.data.items.filter(
      (item) => item.type === "skill"
    );
    const hasPlayerMadeSkills = playerMadeSkills.length;

    if (hasPlayerMadeSkills) {
      for (const sk of playerMadeSkills) {
        if (!this.v12SkillKeys.includes(sk.name)) {
          this.v12SkillKeys.push(sk.name);
          this.v12SkillValues.push({
            value: sk.name,
            label: sk.name,
          });
        }
      }
    }
    this.isDataLoaded = true;
  }

  async _prepareContext() {
    if (!this.isDataLoaded) {
      await this.loadData();
    }
    const context = {};

    context.item = this.document;
    context.system = this.document.system;

    // Ensure effects is always an array, not an object
    const effects = context.item.system.effects || [];
    context.system.effects = Array.isArray(effects)
      ? effects
      : Object.values(effects);

    context.applicable_stats = this.v12StatValues;
    context.applicable_skills = this.v12SkillValues;
    context.isGM = game.user.isGM;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;

    context.tabs = this._prepareTabs("primary");

    return context;
  }

  async _preparePartContext(partId, context) {
    switch (partId) {
      case "description":
      case "effects":
        context.tab = context.tabs[partId];
        break;
      default:
    }
    return context;
  }

  get isEditable() {
    // Only GMs can edit achievements
    return game.user.isGM;
  }
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    // Add special handling for advantage/disadvantage stat/skill mutual exclusion
    if (game.user.isGM) {
      html.querySelectorAll(".effect-item").forEach((item, index) => {
        const effectTypeSelect = item.querySelector(".effect-subtype");
        if (!effectTypeSelect) return;

        const effectType = effectTypeSelect.value;

        // Only set up mutual exclusion for advantage/disadvantage
        if (effectType === "advantage" || effectType === "disadvantage") {
          const statSelect = item.querySelector(
            `.effect-stat[name="system.effects.${index}.stat"]`
          );
          const skillSelect = item.querySelector(
            `.effect-skill[name="system.effects.${index}.skill"]`
          );

          if (!statSelect || !skillSelect) return;

          // Check if handlers already attached
          if (statSelect.dataset.handlerAttached) return;
          statSelect.dataset.handlerAttached = "true";
          skillSelect.dataset.handlerAttached = "true";

          // When stat is selected, clear skill (prevent triggering change on skill)
          statSelect.addEventListener("change", (e) => {
            if (e.target.value && skillSelect.value) {
              // Temporarily remove the skill's handler to prevent circular triggers
              skillSelect.value = "";
              // Manually trigger form submission
              this.element.querySelector("form")?.requestSubmit();
            }
          });

          // When skill is selected, clear stat (prevent triggering change on stat)
          skillSelect.addEventListener("change", (e) => {
            if (e.target.value && statSelect.value) {
              // Temporarily remove the stat's handler to prevent circular triggers
              statSelect.value = "";
              // Manually trigger form submission
              this.element.querySelector("form")?.requestSubmit();
            }
          });
        }
      });
    }
  }

  // eslint-disable-next-line no-unused-vars
  static async onAddEffect(event, target) {
    event.preventDefault();
    // Convert to array if it's an object (Foundry sometimes does this)
    const currentEffects = this.document.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? [...currentEffects]
      : Object.values(currentEffects);
    effects.push({
      effectType: "statMod",
      stat: "",
      bonus: 0,
      skill: "",
      customDescription: "",
    });
    await this.document.update({ "system.effects": effects });
  }

  static async onDeleteEffect(event, target) {
    event.preventDefault();
    const index = parseInt(target.dataset.index);
    // Convert to array if it's an object (Foundry sometimes does this)
    const currentEffects = this.document.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? [...currentEffects]
      : Object.values(currentEffects);
    effects.splice(index, 1);
    await this.document.update({ "system.effects": effects });
  }

  static async editDescription(event) {
    event.preventDefault();
    const editor = new foundry.applications.ux.TextEditor({
      document: this.document,
      field: "system.description",
      button: true,
    });
    editor.render(true);
  }
}
