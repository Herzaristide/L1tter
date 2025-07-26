import { MeiliSearch } from 'meilisearch';

const meiliClient = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY || 'masterKey',
});

export default meiliClient;
