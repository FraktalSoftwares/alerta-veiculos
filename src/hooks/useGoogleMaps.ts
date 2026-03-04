/// <reference types="google.maps" />
import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const SCRIPT_ID = 'google-maps-script';
const CALLBACK_NAME = '__onGoogleMapsLoaded';

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

  if (window.google?.maps?.Map) {
    globalState = 'loaded';
    return Promise.resolve();
  }

  globalPromise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      if (window.google?.maps?.Map) {
        notify('loaded');
        resolve();
        return;
      }
      const check = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(check);
          notify('loaded');
          resolve();
        }
      }, 100);
      return;
    }

    notify('loading');

    (window as any)[CALLBACK_NAME] = () => {
      delete (window as any)[CALLBACK_NAME];
      notify('loaded');
      resolve();
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete (window as any)[CALLBACK_NAME];
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
