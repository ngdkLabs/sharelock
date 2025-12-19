import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

// Alarm sound using Web Audio API
const playAlarmSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (startTime: number, frequency: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Play alarm pattern: high-low-high-low repeated
    const now = audioContext.currentTime;
    for (let i = 0; i < 6; i++) {
      playBeep(now + i * 0.3, i % 2 === 0 ? 880 : 660, 0.25);
    }
    
    // Close audio context after alarm finishes
    setTimeout(() => {
      audioContext.close();
    }, 2000);
    
  } catch (error) {
    console.error('Error playing alarm sound:', error);
  }
};

// Vibration pattern for SOS (morse code: ... --- ...)
const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    // SOS pattern: short-short-short, long-long-long, short-short-short
    const sosPattern = [
      100, 50, 100, 50, 100, // S: ...
      200, // pause
      300, 50, 300, 50, 300, // O: ---
      200, // pause
      100, 50, 100, 50, 100, // S: ...
    ];
    navigator.vibrate(sosPattern);
  }
};

export const useSOSAlert = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const processedMessages = useRef<Set<string>>(new Set());

  const triggerSOSAlert = useCallback((senderName: string, withAlarm: boolean = true) => {
    // Play alarm sound and vibrate only if enabled
    if (withAlarm) {
      playAlarmSound();
      vibrateDevice();
    }
    
    // Show persistent toast
    toast.error(`🚨 SOS DARURAT dari ${senderName}!`, {
      description: 'Teman Anda membutuhkan bantuan segera!',
      duration: 10000,
      action: {
        label: 'Lihat',
        onClick: () => {
          window.location.href = '/chat';
        },
      },
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('sos-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Check if this is an SOS message and hasn't been processed
          if (
            message.content?.includes('🚨 SOS DARURAT!') &&
            !processedMessages.current.has(message.id)
          ) {
            processedMessages.current.add(message.id);
            
            // Get sender's profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('user_id', message.sender_id)
              .single();
            
            // Get current user's profile to check alarm setting
            const { data: myProfile } = await supabase
              .from('profiles')
              .select('sos_alarm_enabled')
              .eq('user_id', user.id)
              .single();
            
            const senderName = senderProfile?.full_name || senderProfile?.username || 'Teman';
            const alarmEnabled = myProfile?.sos_alarm_enabled ?? true;
            
            triggerSOSAlert(senderName, alarmEnabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, triggerSOSAlert]);

  return { triggerSOSAlert };
};
