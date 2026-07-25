import { DayZPlayerProvider } from './dayzProvider.js';
import { SevenDaysToDiePlayerProvider } from './sevenDaysToDieProvider.js';

export function createPlayerProviderRegistry() {
  const providers = [
    new DayZPlayerProvider(),
    new SevenDaysToDiePlayerProvider(),
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
