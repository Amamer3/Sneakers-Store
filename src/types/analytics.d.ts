interface AnalyticsInstance {
  track(event: string, properties?: Record<string, any>): void;
  page(properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
}

interface Window {
  analytics?: AnalyticsInstance;
}
