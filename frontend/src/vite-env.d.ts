/// <reference types="vite/client" />
// src/svg.d.ts
declare module '*.svg?react' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  //  more environment variables 
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}