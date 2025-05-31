declare module '@twa-dev/sdk' {
  interface WebAppUser {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }

  interface WebAppInitData {
    query_id?: string;
    user?: WebAppUser;
    receiver?: WebAppUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  }

  interface TelegramWebApp {
    ready(): void;
    expand(): void;
    close(): void;
    showAlert(message: string): void;
    isVersionAtLeast(version: string): boolean;
    initDataUnsafe: WebAppInitData;
    backgroundColor?: string;
    colorScheme?: 'light' | 'dark';
    HapticFeedback?: {
      notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    };
  }

  const WebApp: TelegramWebApp;
  export default WebApp;
} 