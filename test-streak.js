const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ijpvephwwuggqamveqrd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA1ODI3MywiZXhwIjoyMDg4NjM0MjczfQ.Hh32BzS7f5Ols9Y8ykwhkF1D76N-7nFxz0DE4Gs71lo'
);

async function test() {
    const { data, error } = await supabase.rpc('update_student_streak', { student_uuid: '24c9d5f3-3b20-414e-b534-149e7e11fd8c' });
    console.log('Update streak result:', data, error);
}

test();
