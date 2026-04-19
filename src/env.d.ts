/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly KRL_BEARER_TOKEN?: string;
  readonly KRL_BASE_URL?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly TIJE_BASE_URL?: string;
  readonly TIJE_AUTHORIZATION?: string;
  readonly TIJE_DEVICE_ID?: string;
  readonly TRANSJAKARTA_AUTH_EMAIL?: string;
  readonly TRANSJAKARTA_AUTH_PASSWORD?: string;
  readonly TRANSJAKARTA_AUTH_SECRET?: string;
}

declare namespace App {
  interface Locals {
    transjakartaAuthed: boolean;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:pwa-register/react" {
  import type { Dispatch, SetStateAction } from "react";
  import type { RegisterSWOptions } from "vite-plugin-pwa/types";

  export type { RegisterSWOptions };

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
