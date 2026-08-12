import { sb } from './supabase';

export async function dbLoad<T>(table: string, userId: string): Promise<T[]> {
  const { data, error } = await sb.from(table).select('id,data').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((r: any) => r.data as T);
}

export async function dbUpsert(table: string, userId: string, item: { id: string }) {
  const { error } = await sb
    .from(table)
    .upsert({ id: item.id, user_id: userId, data: item, updated_at: new Date().toISOString() });
  if (error) console.error(`dbUpsert(${table}) failed`, error);
}

export async function dbDelete(table: string, id: string) {
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) console.error(`dbDelete(${table}) failed`, error);
}
