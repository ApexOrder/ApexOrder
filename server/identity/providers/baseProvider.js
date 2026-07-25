export class BasePlayerProvider {
  constructor(providerName) {
    const name = String(providerName || '').trim().toLowerCase();
    if (!name) throw new Error('A provider name is required.');
    this.providerName = name;
  }

  async getOnlinePlayers(_server) {
    throw new Error(`${this.providerName} does not implement getOnlinePlayers().`);
  }
}
