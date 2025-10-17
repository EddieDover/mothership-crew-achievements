# Mothership Crew Achievements

A FoundryVTT module for the Mothership RPG system that adds a crew achievements system to character sheets using native Foundry items.

## Features

- **Native Item Integration**: Achievements are standard FoundryVTT items that work with the existing item system. THis means creating them is as way as making a new **item** and selecting **achievement** in the item type. This also means you can organize them into folders, collections, compimendiums, etc. You award them to players by simply dropping them onto your players character sheet.
- **Automated Effects System**: Achievements can provide mechanical bonuses/penalties that can automatically apply to rolls:
  - Stat modifiers (e.g., +1 to Strength)
  - Skill modifiers (e.g., +5 to Firearms)
  - Advantage on stat or skill rolls
  - Disadvantage on stat or skill rolls
  - Custom narrative effects
- **Character Sheet Tab**: An "Achievements" tab is added to Mothership character sheets. See Screenshots.
- **Chat Notifications**: Automatic chat messages when achievements are awarded and when their effects activate during rolls so you're never taken by surprise. See Screenshots.

## Requirements

- **Foundry VTT**: v13+
- **Mothership System**: v0.6.0+

## Installation

1. In Foundry VTT, go to the Add-on Modules tab
2. Click "Install Module"
3. Search for "Mothership Crew Achievements" or paste the manifest URL
4. Click Install

### Manifest URL

```
https://github.com/EddieDover/mothership-crew-achievements/releases/latest/download/module.json
```

## Usage

### For GMs

#### Creating Achievements

1. Open the **Items Directory** (right sidebar)
2. Click **Create Item**
3. Name your achievement
4. Select **"achievement"** as the Type
5. Click **Create Item**
6. The achievement sheet will open where you can:
   - Set a custom icon/image
   - Write a description
   - Add effects (positive or negative)

#### Adding Effects to Achievements

In the achievement item sheet, you can add mechanical effects that automatically apply when characters make rolls:

1. Click **"Add Effect"** button
2. Choose the effect type from the dropdown:
   - **Stat Modifier**: Adds a flat bonus or penalty to a specific stat (e.g., +5 to Strength, -5 to Sanity)
   - **Skill Modifier**: Adds a flat bonus or penalty to a specific skill (e.g., +10 to Combat, -10 to First Aid)
   - **Advantage**: Grants advantage on rolls for a specific stat or skill
   - **Disadvantage**: Grants disadvantage on rolls for a specific stat or skill
   - **Custom**: For narrative effects without mechanical automation
3. For Stat/Skill Modifiers: Select the stat or skill and enter the bonus value (use negative numbers for penalties)
4. For Advantage/Disadvantage: Select either a stat or skill (not both). If you want to modify more than one stat/skill, just add a second effect.
5. For Custom effects: Enter a description of the effect. Custom effects are narrative/cosmetic/up to you and your players to remember and deal with.
6. Click **Add Effect** again to add more effects
7. Delete unwanted effects with the trash icon

**Important Notes:**

- This module will prompt the player with a yes/no popup every time they make a roll that could potentially use one of their achievements modifiers. The player must consent or the modifiers will not be applied.

#### Awarding Achievements to Characters

1. Open the Items Directory
2. Drag the achievement item onto a character sheet
3. A chat message will automatically announce the achievement

### For Players

Players can view their earned achievements by:

1. Opening their character sheet
2. Clicking the **Achievements** tab
3. Viewing all earned achievements with:
   - Achievement icon
   - Name and description
   - Any effects (positive or negative)

## Screenshots

### Creation Prompt

![creation_prompt](https://github.com/user-attachments/assets/e44d5b28-a7d2-4e83-bff8-5a40d9554870)

### Creation Description

![creation_description](https://github.com/user-attachments/assets/48af02de-b748-4329-8e62-7f31f360c32b)

### Creation Effects

![creation_effects](https://github.com/user-attachments/assets/606a4959-0ec0-4d87-84c1-9c05d52a3d0c)

### Character Sheet

![character_sheet](https://github.com/user-attachments/assets/bde68f50-5621-4a20-9632-c0c51d11bd13)

### Roll Prompt

![achievement_roll_request](https://github.com/user-attachments/assets/38986d6d-4095-4dcc-bceb-a5348ae675b3)

EEE Roll Result

![achievement_roll](https://github.com/user-attachments/assets/5acfaec4-12b0-4c14-b804-89dbb205e89c)

### Achievement Bestow

![achievement_bestow](https://github.com/user-attachments/assets/b6343ae5-9138-4be1-91b3-2f6d994da543)


## Support

If you encounter any issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/EddieDover/mothership-crew-achievements/issues).

Otherwise, please contact me on Discord: EddieDover or at my Discord Server [here](https://discord.gg/hshfZA73fG).

## Example Achievements

### Sole Survivor

- **Description**: "You were the only one to make it back alive from a disastrous mission."
- **Effects**:
  - Disadvantage on Sanity rolls
  - Custom: "Haunted by survivor's guilt"

### Honorary Marine

- **Description**: "Spent time training/bonding with the group of Marines you befriended."
- **Effects**:
  - +5 bonus to Firearms skill
  - Advantage on Body rolls
  - Custom: "Honorary Marine"

### First Contact (Gone Wrong)

- **Description**: "You were the first to encounter a new alien species. It didn't go well."
- **Effects**:
  - -5 penalty to Intellect stat
  - Custom: "Xenophobia: Struggle with alien encounters"

### Battle Hardened

- **Description**: "Survived multiple combat encounters against overwhelming odds."
- **Effects**:
  - +5 bonus to Combat skill
  - -5 penalty to Sanity stat

## Credits

### Images

default.webp - [https://game-icons.net/1x1/skoll/achievement.html](https://game-icons.net/1x1/skoll/achievement.html)
