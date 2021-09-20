declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PRISMIC_API_ENDPOINT: string;
    }
  }
}

export {};
