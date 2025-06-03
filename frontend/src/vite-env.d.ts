/// <reference types="vite/client" />
// src/svg.d.ts
declare module '*.svg?react' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
// interface ImportMetaEnv {
//   readonly VITE_BACKEND_URL: string;
//   readonly VITE_Maps_API_KEY: string;
//   //  more environment variables 
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }

declare global {
  interface Window {
    [key: string]: unknown; // Allows any string property, including your dynamic callback name
                        // This is a common way to handle dynamically added global properties.
    google?: {
      maps?: {
        [key: string]: unknown; // Keep this for google.maps properties
      };
    };
  }
}
export {};