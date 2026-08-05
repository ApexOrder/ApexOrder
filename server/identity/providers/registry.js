import { DayZPlayerProvider } from './dayzProvider.js';
import { PalworldPlayerProvider } from './palworldProvider.js';
import { SevenDaysToDiePlayerProvider } from './sevenDaysToDieProvider.js';

export function createPlayerProviderRegistry() {
  const providers = [
    new DayZPlayerProvider(),
    new SevenDaysToDiePlayerProvider(),
    new PalworldPlayerProvider(),
  ];

  return {
    all() {
      return [...providers];
    },

    findForServer(server) {
      return providers.find((provider) => provider.supports(server)) || null;
    },
  };
}
