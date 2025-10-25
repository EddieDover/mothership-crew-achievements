/**
 * Jest test setup for Foundry VTT module testing
 * This file mocks the Foundry VTT global objects needed for testing
 */

import { beforeEach, jest } from "@jest/globals";

// Mock Foundry VTT globals
global.game = {
  i18n: {
    localize: jest.fn((key) => key),
    format: jest.fn((key, data) => {
      // Simple placeholder replacement for testing
      let result = key;
      if (data) {
        Object.entries(data).forEach(([k, v]) => {
          result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        });
      }
      return result;
    }),
  },
  settings: {
    get: jest.fn((module, setting) => {
      // Default settings for testing
      if (setting === "enableRollAutomation") return true;
      if (setting === "enableAchievementMessages") return true;
      return null;
    }),
    register: jest.fn(),
  },
  user: {
    id: "test-user-id",
    isGM: true,
  },
  users: new Map(),
  packs: {
    filter: jest.fn(() => []),
    get: jest.fn(() => null),
  },
  system: {
    documentTypes: {
      Item: {},
      Actor: {},
    },
    template: {
      Actor: {
        character: {
          stats: {
            strength: {},
            speed: {},
            intellect: {},
            combat: {},
          },
        },
      },
    },
  },
};

global.foundry = {
  utils: {
    expandObject: jest.fn((obj) => {
      // Simple expand implementation for testing
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const parts = key.split(".");
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      }
      return result;
    }),
  },
  applications: {
    api: {
      DialogV2: {
        confirm: jest.fn(() => Promise.resolve(true)),
      },
      HandlebarsApplicationMixin: jest.fn((base) => base),
    },
    sheets: {
      ItemSheetV2: class ItemSheetV2 {
        constructor() {}
      },
    },
  },
  data: {
    fields: {
      ImageField: jest.fn(),
      HTMLField: jest.fn(),
      ArrayField: jest.fn(),
    },
  },
  abstract: {
    TypeDataModel: class TypeDataModel {
      static defineSchema() {
        return {};
      }
    },
  },
};

global.ChatMessage = {
  create: jest.fn(() => Promise.resolve({})),
};

global.CONFIG = {
  Item: {
    dataModels: {},
  },
  Actor: {
    documentClass: {
      prototype: {
        chooseSkill: jest.fn(),
        chooseAttribute: jest.fn(),
        rollCheck: jest.fn(),
        prepareDerivedData: jest.fn(),
        parseRollResult: jest.fn(),
      },
    },
  },
};

global.Hooks = {
  once: jest.fn((event, callback) => {
    // Store hooks for potential execution in tests
    if (!global.Hooks._hooks) global.Hooks._hooks = {};
    if (!global.Hooks._hooks[event]) global.Hooks._hooks[event] = [];
    global.Hooks._hooks[event].push(callback);
  }),
  on: jest.fn((event, callback) => {
    if (!global.Hooks._hooks) global.Hooks._hooks = {};
    if (!global.Hooks._hooks[event]) global.Hooks._hooks[event] = [];
    global.Hooks._hooks[event].push(callback);
  }),
  call: jest.fn((event, ...args) => {
    if (global.Hooks._hooks?.[event]) {
      global.Hooks._hooks[event].forEach((callback) => callback(...args));
    }
  }),
};

global.loadTemplates = jest.fn(() => Promise.resolve());

global.DocumentSheetConfig = {
  registerSheet: jest.fn(),
};

global.Item = class Item {
  constructor(data) {
    Object.assign(this, data);
  }
};

global.Handlebars = {
  registerHelper: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
