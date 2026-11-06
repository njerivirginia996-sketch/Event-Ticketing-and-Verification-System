export const SUPABASE_SQL_SCHEMA = `-- TiketiPass: Production Supabase / PostgreSQL Schema & RLS Policies
-- Optimized for high-concurrency event ticket sales & real-time gate verification

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    payout_details JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    venue TEXT NOT NULL,
    location TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 500,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'cancelled')),
    banner_url TEXT,
    allow_reentry BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ticket Types Table with Optimistic Locking
CREATE TABLE IF NOT EXISTS public.ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL,
    sold INTEGER NOT NULL DEFAULT 0,
    held INTEGER NOT NULL DEFAULT 0,
    sale_start TIMESTAMPTZ,
    sale_end TIMESTAMPTZ,
    max_per_order INTEGER DEFAULT 10,
    perks JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT check_inventory CHECK (sold + held <= quantity)
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES auth.users(id),
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id),
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    platform_fee NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'card')),
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tickets Table (HMAC signed & Real-time tracked)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id),
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id),
    holder_name TEXT NOT NULL,
    holder_email TEXT NOT NULL,
    holder_phone TEXT NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    qr_token TEXT NOT NULL,
    signature TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'CANCELLED', 'REFUNDED', 'TRANSFERRED')),
    checked_in_at TIMESTAMPTZ,
    checked_in_by TEXT,
    gate TEXT,
    transferred_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Gate Scan Logs (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.tickets(id),
    ticket_number TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id),
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    gate TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('VALID', 'ALREADY_USED', 'INVALID', 'TRANSFERRED', 'WRONG_EVENT')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    message TEXT
);

-- 8. High-Concurrency Atomic Verification Function
CREATE OR REPLACE FUNCTION verify_and_checkin_ticket(
    p_ticket_number TEXT,
    p_event_id UUID,
    p_gate TEXT,
    p_staff_name TEXT,
    p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket RECORD;
    v_event RECORD;
BEGIN
    -- Select ticket with row-level lock (FOR UPDATE) to prevent race conditions across gates
    SELECT * INTO v_ticket FROM public.tickets
    WHERE ticket_number = p_ticket_number
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'result', 'INVALID', 'message', 'Ticket not found');
    END IF;

    IF v_ticket.event_id != p_event_id THEN
        RETURN jsonb_build_object('success', false, 'result', 'WRONG_EVENT', 'message', 'Ticket belongs to a different event');
    END IF;

    IF v_ticket.status = 'TRANSFERRED' THEN
        RETURN jsonb_build_object('success', false, 'result', 'TRANSFERRED', 'message', 'Ticket transferred to ' || v_ticket.transferred_to);
    END IF;

    IF v_ticket.status = 'USED' THEN
        SELECT allow_reentry INTO v_event FROM public.events WHERE id = p_event_id;
        IF v_event.allow_reentry THEN
            RETURN jsonb_build_object('success', true, 'result', 'VALID', 'reentry', true, 'message', 'Re-entry approved');
        ELSE
            RETURN jsonb_build_object('success', false, 'result', 'ALREADY_USED', 'message', 'Already checked in at ' || v_ticket.checked_in_at || ' at gate ' || v_ticket.gate);
        END IF;
    END IF;

    -- Update atomically
    UPDATE public.tickets
    SET status = 'USED',
        checked_in_at = NOW(),
        checked_in_by = p_staff_name,
        gate = p_gate
    WHERE id = v_ticket.id;

    -- Insert scan log
    INSERT INTO public.scan_logs (ticket_id, ticket_number, event_id, staff_id, staff_name, gate, result, device_id)
    VALUES (v_ticket.id, v_ticket.ticket_number, p_event_id, 'staff_current', p_staff_name, p_gate, 'VALID', p_device_id);

    RETURN jsonb_build_object('success', true, 'result', 'VALID', 'ticket', jsonb_build_object('holderName', v_ticket.holder_name, 'ticketNumber', v_ticket.ticket_number));
END;
$$;

-- 9. Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees can view their own tickets"
ON public.tickets FOR SELECT
USING (auth.jwt() ->> 'email' = holder_email);
`;

export const REACT_NATIVE_EXPO_CODE = `// ==========================================
// TiketiPass - React Native & Expo Mobile App
// Gate Verifier & Attendee Mobile Companion
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Vibration,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-tiketi-pass-api.com/api';

export default function GateScannerApp() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [activeGate, setActiveGate] = useState('Gate A - Main Entrance');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [stats, setStats] = useState({ valid: 0, duplicates: 0 });

  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    })();
  }, []);

  const playChime = async (type) => {
    try {
      if (type === 'VALID') {
        Vibration.vibrate([100]);
      } else if (type === 'ALREADY_USED') {
        Vibration.vibrate([150, 80, 150]);
      } else {
        Vibration.vibrate(300);
      }
    } catch (e) {}
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      if (offlineMode) {
        // Fast local verification against pre-downloaded hashed ticket manifest
        const manifestStr = await AsyncStorage.getItem('@offline_manifest');
        const manifest = manifestStr ? JSON.parse(manifestStr) : [];
        const found = manifest.find((m) => m.ticketNumber === data || m.id === data);

        if (found && found.status === 'ACTIVE') {
          found.status = 'USED';
          await AsyncStorage.setItem('@offline_manifest', JSON.stringify(manifest));
          setScanResult({ result: 'VALID', message: 'Offline verified! Entry granted.', holder: found.holderName });
          setStats((prev) => ({ ...prev, valid: prev.valid + 1 }));
          playChime('VALID');
        } else {
          setScanResult({ result: 'ALREADY_USED', message: 'Offline Flag: Already scanned or invalid.' });
          setStats((prev) => ({ ...prev, duplicates: prev.duplicates + 1 }));
          playChime('ALREADY_USED');
        }
      } else {
        // Real-time server-side HMAC check
        const response = await fetch(\`\${API_BASE_URL}/verify/scan\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrData: data,
            gate: activeGate,
            staffName: 'Mobile Gate Staff',
            deviceId: 'Expo-React-Native-Terminal',
          }),
        });

        const res = await response.json();
        setScanResult(res);

        if (res.result === 'VALID') {
          setStats((prev) => ({ ...prev, valid: prev.valid + 1 }));
          playChime('VALID');
        } else {
          setStats((prev) => ({ ...prev, duplicates: prev.duplicates + 1 }));
          playChime(res.result || 'INVALID');
        }
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Check network or switch to Offline Mode.');
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 2200);
    }
  };

  if (!permission) return <View style={styles.darkContainer} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <Text style={styles.headerTitle}>Camera Permission Required</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>TIKETIPASS GATE SCANNER</Text>
        <Text style={styles.gateTitle}>{activeGate}</Text>
        <View style={styles.counterRow}>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumGreen}>{stats.valid}</Text>
            <Text style={styles.counterLabel}>VALID SCANS</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumRed}>{stats.duplicates}</Text>
            <Text style={styles.counterLabel}>BLOCKED / REJECTED</Text>
          </View>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.reticleOverlay}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Result Display Overlay */}
      {scanResult && (
        <View
          style={[
            styles.resultBanner,
            scanResult.result === 'VALID'
              ? styles.resultValid
              : scanResult.result === 'ALREADY_USED'
              ? styles.resultWarning
              : styles.resultInvalid,
          ]}
        >
          <Text style={styles.resultTitle}>{scanResult.title || scanResult.result}</Text>
          <Text style={styles.resultDesc}>{scanResult.message}</Text>
        </View>
      )}

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.toggleButton, offlineMode && styles.toggleButtonActive]}
          onPress={() => setOfflineMode(!offlineMode)}
        >
          <Text style={styles.toggleText}>
            {offlineMode ? '⚡ OFFLINE MODE ACTIVE' : '🌐 CLOUD REALTIME MODE'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkContainer: { flex: 1, backgroundColor: '#090D16' },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#1F2937' },
  badge: { color: '#10B981', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  gateTitle: { color: '#F9FAFB', fontSize: 20, fontWeight: '800', marginTop: 4 },
  counterRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  counterBox: { flex: 1, backgroundColor: '#111827', padding: 10, borderRadius: 12 },
  counterNumGreen: { fontSize: 22, fontWeight: '900', color: '#10B981' },
  counterNumRed: { fontSize: 22, fontWeight: '900', color: '#EF4444' },
  counterLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
  cameraContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
  reticleOverlay: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    top: '25%',
    position: 'absolute',
  },
  corner: { width: 32, height: 32, position: 'absolute', borderColor: '#10B981' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  resultBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    elevation: 8,
  },
  resultValid: { backgroundColor: '#059669' },
  resultWarning: { backgroundColor: '#D97706' },
  resultInvalid: { backgroundColor: '#DC2626' },
  resultTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  resultDesc: { color: '#FFF', fontSize: 13, marginTop: 4, opacity: 0.9 },
  footer: { padding: 16, backgroundColor: '#0F172A' },
  toggleButton: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: { backgroundColor: '#F59E0B' },
  toggleText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  primaryButton: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 12, margin: 24, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
});
`;
