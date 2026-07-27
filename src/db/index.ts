import { DBAdapter } from './adapters/interface';
import { MongoDBAdapter } from './adapters/mongodb';
import { SupabaseAdapter } from './adapters/supabase';

let dbAdapter: DBAdapter | null = null;

export const getDB = async (): Promise<DBAdapter> => {
  if (dbAdapter) {
    return dbAdapter;
  }

  const provider = process.env.DB_PROVIDER || 'mongodb';

  if (provider === 'supabase') {
    if (!dbAdapter) dbAdapter = new SupabaseAdapter();
  } else {
    if (!dbAdapter) dbAdapter = new MongoDBAdapter();
  }

  try {
    await dbAdapter.connect();
    console.log(`Successfully connected to Database via ${provider} adapter`);
  } catch (error) {
    console.error(`Failed to connect to Database via ${provider} adapter:`, error);
    throw error;
  }

  return dbAdapter;
};
