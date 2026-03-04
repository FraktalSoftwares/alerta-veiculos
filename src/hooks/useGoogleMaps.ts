/// <reference types="google.maps" />
import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const SCRIPT_ID = 'google-maps-script';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

let globalState: LoadState = 'idle';
let globalPromise: Promise<void> | null = null;
const listeners = new Set<(state: LoadState) => void>();

function notify(state: LoadState) {
  globalState = state;
  listeners.forEach((fn) => fn(state));
}

function loadScript(): Promise<void> {
  if (globalPromise) return globalPromise;

  if (window.google?.maps) {
    globalState = 'loaded';
    return Promise.resolve();
  }

  globalPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.google?.maps) {
        notify('loaded');
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        notify('loaded');
        resolve();
      });
      existing.addEventListener('error', () => {
        notify('error');
        reject(new Error('Failed to load Google Maps'));
      });
      return;
    }

    notify('loading');

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      notify('loaded');
      resolve();
    };
    script.onerror = () => {
      notify('error');
      globalPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  });

  return globalPromise;
}

export function useGoogleMaps(): { isLoaded: boolean; error: boolean } {
  const [state, setState] = useState<LoadState>(globalState);

  useEffect(() => {
    if (globalState === 'loaded') {
      setState('loaded');
      return;
    }

    const handler = (s: LoadState) => setState(s);
    listeners.add(handler);

    loadScript().catch(() => {});

    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    isLoaded: state === 'loaded',
    error: state === 'error',
  };
}
