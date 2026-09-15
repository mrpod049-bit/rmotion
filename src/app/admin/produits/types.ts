export type Spec = { label: string; value: string };

export type MachineInput = {
  id?: number | null;
  category_id: number;
  name: string;
  name_en?: string;
  slug: string;
  tagline?: string;
  tagline_en?: string;
  description?: string;
  description_en?: string;
  specs?: Spec[];
  specs_en?: Spec[];
  options?: string[];
  options_en?: string[];
  price_range?: string | null;
  images?: string[];
  featured?: boolean;
  published?: boolean;
};
