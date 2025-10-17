/**
 * @typedef MothershipAchievementEffect
 * @property {'statMod' | 'flatBonus' | 'conditional' | 'advantage' | 'disadvantage'} effectType - The type of effect.
 * @property {string} stat - The stat affected by the effect (if applicable).
 * @property {number} bonus - The bonus value applied by the effect (if applicable).
 * @property {string} condition - The condition under which the effect applies (if applicable).
 */

/**
 * @typedef MothershipAchievement
 * @property {string} name - The name of the achievement.
 * @property {string} description - A detailed description of the achievement.
 * @property {string} icon - The URL of the icon representing the achievement.
 * @property {Array<MothershipAchievementEffect>} effects - An array of effects associated with the achievement.
 */

export const mothershipachievementypedefs = {}; // This file is only for typedefs
