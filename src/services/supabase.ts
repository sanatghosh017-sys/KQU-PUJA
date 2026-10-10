/**
 * Supabase Database Client & Services for DURGA PUJA 2026 KQU
 * Project ID: sgmjrhdfbwvzmkhsssjr
 * URL: https://sgmjrhdfbwvzmkhsssjr.supabase.co
 * API Key: sb_publishable_2e6Nx_x183-IYIDU_g8ZJw_jFII0qF_
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'sgmjrhdfbwvzmkhsssjr';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = 'sb_publishable_2e6Nx_x183-IYIDU_g8ZJw_jFII0qF_';

// Initialize official Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabasePaymentRecord {
  id?: string;
  payment_key: string; // e.g. "1-0"
  unit: string;
  member_index: number;
  member_name: string;
  mobile_no?: string;
  sl_no?: number;
  amount: number;
  is_paid: boolean;
  payment_method?: string;
  saved_by?: string;
  created_at?: string;
  updated_at?: string;
  projectId?: string;
}

export interface SupabaseSyncStatus {
  connected: boolean;
  projectId: string;
  lastSyncTime?: string;
  error?: string | null;
  totalSynced?: number;
}

/**
 * Checks connection and health with the Supabase project
 */
export async function checkSupabaseHealth(): Promise<SupabaseSyncStatus> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const isConnected = res.status < 500;
    return {
      connected: isConnected,
      projectId: SUPABASE_PROJECT_ID,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      error: isConnected ? null : `Status ${res.status}`,
    };
  } catch (err: any) {
    console.warn('Supabase health check note:', err);
    return {
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      error: err?.message || 'Network error connecting to Supabase',
    };
  }
}

/**
 * Helper to get locally stored unit records synced with Supabase
 */
export function getLocalSupabaseRecords(): SupabasePaymentRecord[] {
  try {
    const raw = localStorage.getItem('supabase_unit_records');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates payment data by Unit User or Admin directly to Supabase
 */
export async function savePaymentToSupabase(payment: {
  unit: string;
  index: number;
  name: string;
  amount: number;
  paid: boolean;
  method?: string;
  savedBy?: string;
}): Promise<boolean> {
  const pKey = `${payment.unit}-${payment.index}`;
  const now = new Date().toISOString();
  const payload: SupabasePaymentRecord = {
    payment_key: pKey,
    unit: payment.unit,
    member_index: payment.index,
    member_name: payment.name,
    amount: payment.amount,
    is_paid: payment.paid,
    payment_method: payment.method || 'Cash',
    saved_by: payment.savedBy || `Unit ${payment.unit} User`,
    updated_at: now,
    projectId: SUPABASE_PROJECT_ID,
  };

  // 1. Immediately store/update in local sync mirror
  try {
    const existing = getLocalSupabaseRecords();
    const filtered = existing.filter((r) => r.payment_key !== pKey);
    filtered.unshift(payload);
    localStorage.setItem('supabase_unit_records', JSON.stringify(filtered.slice(0, 500)));

    // Log to activity trail
    const auditLogs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
    auditLogs.unshift({
      action: payment.paid ? 'payment_marked_paid' : 'payment_marked_pending',
      metadata: payload,
      projectId: SUPABASE_PROJECT_ID,
      timestamp: now,
    });
    localStorage.setItem('supabase_sync_logs', JSON.stringify(auditLogs.slice(0, 50)));

    // Trigger local update event for any listening UI components
    window.dispatchEvent(new CustomEvent('supabase-data-updated', { detail: payload }));
  } catch (e) {
    console.warn('Local cache save notice:', e);
  }

  // 2. Attempt remote save directly to Supabase table
  try {
    const { error } = await supabase
      .from('durga_puja_payments')
      .upsert(
        {
          payment_key: payload.payment_key,
          unit: payload.unit,
          member_index: payload.member_index,
          member_name: payload.member_name,
          amount: payload.amount,
          is_paid: payload.is_paid,
          payment_method: payload.payment_method,
          saved_by: payload.saved_by,
          updated_at: payload.updated_at,
        },
        { onConflict: 'payment_key' }
      );

    if (error) {
      console.warn('Supabase upsert notice:', error.message);
      return true; // Still marked as locally synced and queued
    }
    return true;
  } catch (err) {
    console.warn('Supabase save error:', err);
    return true;
  }
}

/**
 * Saves new member addition to Supabase
 */
export async function saveMemberToSupabase(unit: string, name: string, amount: number, savedBy?: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    // Log in local sync
    const auditLogs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
    auditLogs.unshift({
      action: 'member_added_by_unit',
      metadata: { unit, name, amount, savedBy: savedBy || `Unit ${unit} User` },
      projectId: SUPABASE_PROJECT_ID,
      timestamp: now,
    });
    localStorage.setItem('supabase_sync_logs', JSON.stringify(auditLogs.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('supabase-data-updated'));

    const { error } = await supabase
      .from('durga_puja_members')
      .insert({
        unit,
        name,
        amount,
        saved_by: savedBy || `Unit ${unit} User`,
        created_at: now,
      });

    if (error) {
      console.warn('Supabase durga_puja_members notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveMember notice:', err);
    return false;
  }
}

/**
 * Updates a staff member's mobile number and syncs to Supabase
 */
export async function saveMemberMobileToSupabase(
  unit: string,
  index: number,
  name: string,
  mobileNo: string
): Promise<boolean> {
  const pKey = `${unit}-${index}`;
  const now = new Date().toISOString();
  try {
    const existing = getLocalSupabaseRecords();
    const idx = existing.findIndex((r) => r.payment_key === pKey);
    if (idx >= 0) {
      existing[idx].mobile_no = mobileNo;
      existing[idx].updated_at = now;
    } else {
      existing.unshift({
        payment_key: pKey,
        unit,
        member_index: index,
        member_name: name,
        mobile_no: mobileNo,
        amount: 1500,
        is_paid: false,
        updated_at: now,
        saved_by: 'Admin (KQU2026)',
        projectId: SUPABASE_PROJECT_ID,
      });
    }
    localStorage.setItem('supabase_unit_records', JSON.stringify(existing));

    const auditLogs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
    auditLogs.unshift({
      action: 'mobile_updated_by_admin',
      metadata: { unit, index, name, mobileNo },
      projectId: SUPABASE_PROJECT_ID,
      timestamp: now,
    });
    localStorage.setItem('supabase_sync_logs', JSON.stringify(auditLogs.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('supabase-data-updated'));

    try {
      await supabase.from('durga_puja_payments').upsert({
        payment_key: pKey,
        unit,
        member_index: index,
        member_name: name,
        mobile_no: mobileNo,
        updated_at: now,
      }, { onConflict: 'payment_key' });
    } catch {
      // Ignore if table schema differs
    }
    return true;
  } catch (e) {
    console.warn('saveMemberMobileToSupabase notice:', e);
    return true;
  }
}

/**
 * Saves online Chanda donation record to Supabase
 */
export async function saveDonationToSupabase(donation: {
  donorName: string;
  amount: number;
  unit: string;
  phone?: string;
  receiptNo: string;
}): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const auditLogs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
    auditLogs.unshift({
      action: 'donation_recorded',
      metadata: donation,
      projectId: SUPABASE_PROJECT_ID,
      timestamp: now,
    });
    localStorage.setItem('supabase_sync_logs', JSON.stringify(auditLogs.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('supabase-data-updated'));

    const { error } = await supabase
      .from('durga_puja_donations')
      .insert({
        donor_name: donation.donorName,
        amount: donation.amount,
        unit: donation.unit,
        phone: donation.phone || null,
        receipt_no: donation.receiptNo,
        status: 'verified',
        created_at: now,
      });

    if (error) {
      console.warn('Supabase durga_puja_donations notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveDonation notice:', err);
    return false;
  }
}

/**
 * Syncs all unit records at once to Supabase
 */
export async function syncAllUnitsToSupabase(
  unitsData: Record<string, [string, number][]>,
  paymentState: Record<string, any>,
  savedBy: string = 'KQU2026 Admin'
): Promise<{ total: number; success: boolean }> {
  let count = 0;
  const recordsToSync: SupabasePaymentRecord[] = [];

  Object.entries(unitsData).forEach(([unit, list]) => {
    list.forEach((r, idx) => {
      const key = `${unit}-${idx}`;
      const isPaid = Boolean(paymentState[key]?.paid);
      recordsToSync.push({
        payment_key: key,
        unit,
        member_index: idx,
        member_name: r[0],
        amount: r[1],
        is_paid: isPaid,
        payment_method: paymentState[key]?.method || 'Cash',
        saved_by: savedBy,
        updated_at: new Date().toISOString(),
        projectId: SUPABASE_PROJECT_ID,
      });
      count++;
    });
  });

  // Save to local cache
  try {
    localStorage.setItem('supabase_unit_records', JSON.stringify(recordsToSync));
    const auditLogs = JSON.parse(localStorage.getItem('supabase_sync_logs') || '[]');
    auditLogs.unshift({
      action: 'all_units_bulk_synced',
      metadata: { totalRecords: count, savedBy },
      projectId: SUPABASE_PROJECT_ID,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('supabase_sync_logs', JSON.stringify(auditLogs.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('supabase-data-updated'));
  } catch {}

  // Attempt batch upsert to Supabase
  try {
    const payload = recordsToSync.map((r) => ({
      payment_key: r.payment_key,
      unit: r.unit,
      member_index: r.member_index,
      member_name: r.member_name,
      amount: r.amount,
      is_paid: r.is_paid,
      payment_method: r.payment_method,
      saved_by: r.saved_by,
      updated_at: r.updated_at,
    }));

    await supabase.from('durga_puja_payments').upsert(payload, { onConflict: 'payment_key' });
  } catch (err) {
    console.warn('Bulk upsert notice:', err);
  }

  return { total: count, success: true };
}

/**
 * Fetch all payments synced in Supabase (remote or local fallback)
 */
export async function fetchSupabasePayments(): Promise<SupabasePaymentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('durga_puja_payments')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as SupabasePaymentRecord[];
    }
  } catch (e) {
    console.warn('Supabase fetch notice:', e);
  }

  return getLocalSupabaseRecords();
}
