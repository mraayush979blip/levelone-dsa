const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ijpvephwwuggqamveqrd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA1ODI3MywiZXhwIjoyMDg4NjM0MjczfQ.Hh32BzS7f5Ols9Y8ykwhkF1D76N-7nFxz0DE4Gs71lo'
);

async function test() {
    const { data, error } = await supabase.rpc('award_activity_point', {}, { count: 'exact' });
    console.log('Result from award_activity_point:');
    if (error) {
        console.error('ERROR awarding point:', error.message, error.details);
    } else {
        console.dir(data, { depth: null });
    }
}

test();
