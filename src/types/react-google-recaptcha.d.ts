declare module 'react-google-recaptcha' {
  import * as React from 'react';

  export interface ReCAPTCHAProps {
    sitekey: string;
    size?: 'invisible' | 'compact' | 'normal';
    theme?: 'light' | 'dark';
    onChange?: (value: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    tabindex?: number;
    badge?: 'bottomright' | 'bottomleft' | 'inline';
  }

  export default class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
    execute(): void;
    executeAsync(): Promise<string>;
    reset(): void;
  }
}


