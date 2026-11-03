/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any, schemaOptions?: any, resolverOptions?: any): any;
}

declare module 'react-hook-form' {
  export function useForm<T = any>(options?: any): {
    register: (name: any, options?: any) => any;
    handleSubmit: (onValid: (data: T) => any, onInvalid?: any) => (e?: any) => Promise<void>;
    reset: (values?: Partial<T>) => void;
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isValid?: boolean;
    };
    watch?: any;
    setValue?: any;
    getValues?: any;
  };
  export const Controller: any;
  export const useWatch: any;
  export const useFieldArray: any;
}
