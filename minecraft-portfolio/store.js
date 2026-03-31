import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;


export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveBlock(x, y, z, type, sessionId, world){
    const { error } = await supabase
        .from(world)
        .upsert(
            { x, y, z, type, session_id: sessionId },
            { onConflict: 'x,y,z' }
        );
    
    if(error) console.error('save error:', error);
}

export async function loadBlocks(world){
    let allBlocks = [];
    let from = 0;
    const batchSize = 1000;

    while(true){
        const { data, error } = await supabase
            .from(world)
            .select('*')
            .range(from, from + batchSize - 1);
        
        if(error){ console.error('load error:', error); break; }
        if(!data || data.length === 0) break;
        
        allBlocks = allBlocks.concat(data);
        if(data.length < batchSize) break;
        from += batchSize;
    }

    return allBlocks;
}

export async function getSeed(name){
    const { data, error } = await supabase
        .from('World_Settings')
        .select('seed')
        .eq('value', name)
        .maybeSingle();
    
    return data ? parseInt(data.seed) : null;
}

export async function saveSeed(seed, name){
    await supabase
        .from('World_Settings')
        .upsert({ value: name, seed: seed });
}

export async function clearBlocks(world){
    const { error } = await supabase
        .from(world)
        .delete()
        .neq('id', 0); 
}

export async function clearWorldSettings(){
    const { error } = await supabase
        .from('World_Settings')
        .delete()
        .neq('value', ''); // deletes all rows
}


export function subscribeToBlocks(onBlockChange, world){
    return supabase
        .channel(`block-changes-${Math.random()}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: world
        }, (payload) => {
            onBlockChange(payload.new);
        })
        .subscribe();
}

let presenceChannel;

export function initPresence(sessionId, playerName, onPlayersUpdate){
    presenceChannel = supabase.channel('players');
    
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            onPlayersUpdate(state);
        })
        .subscribe(async (status) => {
            if(status === 'SUBSCRIBED'){
                await presenceChannel.track({
                    session_id: sessionId,
                    name: playerName,
                    x: 0,
                    y: 0,
                    z: 0
                });
            }
        });
}

export function updatePresence(x, y, z, name, sessionId){
    if(presenceChannel){
        presenceChannel.track({
            session_id: sessionId,
            name: name,
            x: x,
            y: y,
            z: z
        });
    }
}
export async function saveSign(x, y, z, title, text){
    const { error } = await supabase
        .from('signs')
        .insert({ x, y, z, title, text });
    if(error) console.error('sign save error:', error);
}

export async function loadSigns(){
    const { data, error } = await supabase
        .from('signs')
        .select('*');
    if(error) console.error('sign load error:', error);
    return data;
}

export async function savePortal(x, y, z, url, label, color, world, toWorld, facing){
    const { error } = await supabase
        .from('portals')
        .insert({ x, y, z, url, label, color, world, to_world: toWorld, facing });
    if(error) console.error('portal save error:', error);
}

export async function loadPortals(world){
    const { data, error } = await supabase
        .from('portals')
        .select('*')
        .eq('world', world);
    if(error) console.error('portal load error:', error);
    return data;
}