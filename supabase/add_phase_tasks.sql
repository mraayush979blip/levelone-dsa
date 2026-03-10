-- Step 1: Create phase_tasks table to hold individual problems for a phase
CREATE TABLE IF NOT EXISTS public.phase_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL, -- The LeetCode or other assignment URL
    points INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create task_submissions table to track individual problem completions
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.phase_tasks(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE NOT NULL, -- Denormalized for easier querying
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, task_id) -- A student can only complete a task once
);

-- Step 3: Enable RLS
ALTER TABLE public.phase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS Policies

-- phase_tasks: Everyone can view active Phase Tasks. Only admins can insert/update/delete.
CREATE POLICY "Anyone can view phase tasks" 
    ON public.phase_tasks FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage phase tasks" 
    ON public.phase_tasks FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    );

-- task_submissions: Students can view their own, admins can view all. System handles inserts via stored procedures/API.
CREATE POLICY "Students can view their own task submissions" 
    ON public.task_submissions FOR SELECT 
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all task submissions" 
    ON public.task_submissions FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    );

-- We allow insert from authenticated users so the API can record completions (we rely on API validation)
CREATE POLICY "Users can insert their own task submissions" 
    ON public.task_submissions FOR INSERT 
    WITH CHECK (auth.uid() = student_id);


-- Step 5: Function to calculate if a phase is completed based on tasks
-- This will be useful later if we want to auto-complete a phase when all tasks are done
CREATE OR REPLACE FUNCTION check_phase_completion(p_student_id UUID, p_phase_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_tasks INT;
    completed_tasks INT;
BEGIN
    SELECT COUNT(*) INTO total_tasks FROM phase_tasks WHERE phase_id = p_phase_id;
    
    -- If no tasks, we can't auto-complete based on tasks
    IF total_tasks = 0 THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO completed_tasks 
    FROM task_submissions 
    WHERE student_id = p_student_id AND phase_id = p_phase_id;

    RETURN total_tasks = completed_tasks;
END;
$$;
