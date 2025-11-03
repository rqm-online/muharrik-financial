import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://roqqzbyaaxfqstbadvfm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcXF6YnlhYXhmcXN0YmFkdmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjYxMDEsImV4cCI6MjA3NzY0MjEwMX0.BVGpeIIw8z5n_uwNE9pDKRpE97zXOQYspCCk4vxuZhg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  nim: string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_address?: string;
  room_assignment?: string;
  class?: string;
  status: string;
  enrollment_date: string;
  created_at: string;
  updated_at: string;
};

export type SavingsAccount = {
  id: string;
  student_id: string;
  account_type: string;
  current_balance: number;
  savings_goal?: number;
  goal_description?: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  transaction_type: string;
  student_id?: string;
  savings_account_id?: string;
  amount: number;
  transaction_date: string;
  category?: string;
  description?: string;
  payment_method?: string;
  receipt_number?: string;
  processed_by?: string;
  status: string;
  created_at: string;
};

export type Expense = {
  id: string;
  expense_category: string;
  amount: number;
  expense_date: string;
  description: string;
  receipt_url?: string;
  approved_by?: string;
  approval_status: string;
  payment_method?: string;
  vendor_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type Donation = {
  id: string;
  donation_type: string;
  donor_name?: string;
  donor_contact?: string;
  amount: number;
  donation_date: string;
  purpose?: string;
  allocated_to?: string;
  receipt_number?: string;
  is_anonymous: boolean;
  created_at: string;
};

export type MonthlyReport = {
  id: string;
  report_month: number;
  report_year: number;
  total_spp_revenue: number;
  total_donations: number;
  total_expenses: number;
  total_savings_deposits: number;
  total_savings_withdrawals: number;
  active_student_count: number;
  created_at: string;
};

export type UserRole = 'admin' | 'santri' | 'guru' | 'komite';

export type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  status: string;
  student_id?: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
};

export type Teacher = {
  id: string;
  nip: string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  base_salary: number;
  hourly_rate?: number;
  status: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
};

export type TeacherAssignment = {
  id: string;
  teacher_id: string;
  subject: string;
  class?: string;
  hours_per_week?: number;
  academic_year?: string;
  created_at: string;
};

export type SalaryPayment = {
  id: string;
  teacher_id: string;
  payment_month: number;
  payment_year: number;
  base_amount: number;
  additional_hours: number;
  additional_amount: number;
  total_amount: number;
  payment_date: string;
  payment_status: string;
  notes?: string;
  created_at: string;
};

export type CashTransaction = {
  id: string;
  transaction_type: 'receipt' | 'disbursement';
  amount: number;
  transaction_date: string;
  category?: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  processed_by?: string;
  created_at: string;
};

export type UserActivity = {
  id: string;
  user_id?: string;
  action_type: string;
  module?: string;
  description?: string;
  metadata?: any;
  created_at: string;
};
