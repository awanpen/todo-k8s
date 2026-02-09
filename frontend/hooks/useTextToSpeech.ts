"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    lang = 'en-US',
    rate = 1,
    pitch = 1,
    volume = 1,
    voice = null,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);

      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Cleanup function to cancel any ongoing speech when component unmounts
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech with a small delay to prevent interruption errors
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      
      // Wait a bit before starting new speech to avoid interruption error
      setTimeout(() => {
        startSpeech(text);
      }, 100);
    } else {
      startSpeech(text);
    }
  }, [isSupported, lang, rate, pitch, volume, voice]);

  const startSpeech = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      // Only log non-interrupted errors to avoid console spam
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Speech synthesis error:', event);
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, volume, voice]);

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  };
}
