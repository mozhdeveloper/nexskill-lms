-- Migration: Create transactions table for coach earnings
-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL,
    course_id UUID,
    enrollment_id UUID,
    type TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'PHP',
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    course_title TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    CONSTRAINT valid_type CHECK (type IN ('sale', 'refund', 'payout', 'adjustment')),
    CONSTRAINT valid_status CHECK (status IN ('completed', 'pending', 'failed', 'cancelled'))
);

-- Create indexes
CREATE INDEX idx_transactions_coach ON transactions(coach_id);
CREATE INDEX idx_transactions_course ON transactions(course_id);
CREATE INDEX idx_transactions_enrollment ON transactions(enrollment_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_student ON transactions(student_id);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Coaches can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Insert transactions" ON transactions;

-- Policy 1: Anyone can insert transactions (students make purchases)
CREATE POLICY "Anyone can insert transactions" ON transactions
    FOR INSERT
    WITH CHECK (true);

-- Policy 2: Coaches can view their own transactions
CREATE POLICY "Coaches can view own transactions" ON transactions
    FOR SELECT
    USING (
        auth.uid() = coach_id 
        OR 
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = transactions.course_id 
            AND c.coach_id = auth.uid()
        )
    );

-- Policy 3: Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );
