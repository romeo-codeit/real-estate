-- Function to reserve funds and create investment atomically
CREATE OR REPLACE FUNCTION reserve_funds_for_investment(
  p_user_id UUID,
  p_amount NUMERIC,
  p_investment_type TEXT,
  p_sanity_id TEXT DEFAULT NULL,
  p_roi_rate NUMERIC DEFAULT 0,
  p_duration_months NUMERIC DEFAULT 0,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_investment_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Acquire advisory lock for this user to serialize operations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 2. Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- 3. Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- 4. Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- 5. Calculate final available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  -- 6. Check if sufficient funds
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', v_available, p_amount;
  END IF;

  -- 7. Create the investment
  INSERT INTO investments (
    user_id, 
    sanity_id, 
    amount_invested, 
    investment_type, 
    roi_rate, 
    duration_months, 
    status,
    start_date,
    end_date
  )
  VALUES (
    p_user_id, 
    p_sanity_id, 
    p_amount, 
    p_investment_type::investment_type_enum, 
    p_roi_rate, 
    p_duration_months, 
    'pending',
    p_start_date,
    p_end_date
  )
  RETURNING id INTO v_investment_id;

  -- 8. Return the result
  SELECT jsonb_build_object(
    'id', v_investment_id,
    'status', 'pending',
    'amount_invested', p_amount,
    'available_before', v_available,
    'available_after', v_available - p_amount
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to get user balance details atomically
CREATE OR REPLACE FUNCTION get_user_balance_details(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_result JSONB;
BEGIN
  -- 1. Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- 2. Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- 3. Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- 4. Calculate available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  -- Ensure not negative
  IF v_available < 0 THEN
      v_available := 0;
  END IF;

  SELECT jsonb_build_object(
    'balance', v_balance,
    'pendingWithdrawals', v_pending_withdrawals,
    'pendingInvestments', v_pending_investments,
    'availableToWithdraw', v_available
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to request withdrawal atomically
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_provider TEXT DEFAULT 'crypto',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Acquire advisory lock for this user to serialize operations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 2. Check for existing pending withdrawals (Business Rule: One pending withdrawal at a time?)
  -- Strict mode: If there is ANY pending withdrawal, we might want to block or just sum it up.
  -- The current app logic blocks if ANY pending withdrawal exists. Let's replicate that check or rely on sum.
  -- Replicating "Block if any pending" for safety as per route logic.
  IF EXISTS (SELECT 1 FROM transactions WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending') THEN
     RAISE EXCEPTION 'Existing pending withdrawal found. Please wait for approval.';
  END IF;

  -- 3. Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- 4. Calculate pending withdrawals (Should be 0 if we enforced check above, but good for completeness)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- 5. Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- 6. Calculate available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  -- 7. Check sufficient funds
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', v_available, p_amount;
  END IF;

  -- 8. Create withdrawal transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    provider,
    metadata
  )
  VALUES (
    p_user_id,
    'withdrawal',
    p_amount,
    p_currency,
    'pending',
    p_provider,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- 9. Return Result
  SELECT jsonb_build_object(
    'id', v_transaction_id,
    'status', 'pending',
    'amount', p_amount,
    'available_after', v_available - p_amount
  ) INTO v_result;

  RETURN v_result;
END;
$$;
