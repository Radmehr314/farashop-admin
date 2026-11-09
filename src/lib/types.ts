export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type User = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  type: 'Individual' | 'Legal';
  companyName: string | null;
  roles: string[];
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AuthResponse = {
  tokens: { accessToken: string; accessTokenExpiresAt: string; refreshToken: string };
  user: User;
  isNew: boolean;
};

export type AttributeType = 'Text' | 'Number' | 'Boolean' | 'Select';

export type CategoryAttribute = {
  key: string;
  name: string;
  type: AttributeType;
  unit: string | null;
  options: string[];
  isFilterable: boolean;
  isRequired: boolean;
  sortOrder: number;
};

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  attributes: CategoryAttribute[];
  productCount: number;
};

export type Brand = {
  id: string;
  name: string;
  englishName: string | null;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
};

export type ProductStatus = 'Draft' | 'Published' | 'Archived';

export type SpecValue = { key: string; value: string };
export type ProductImage = { url: string; alt: string | null; sortOrder: number };

export type ProductRow = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  categoryName: string;
  brandName: string | null;
  status: ProductStatus;
  variantCount: number;
  minPrice: number | null;
  totalStock: number;
  updatedAt: string;
};

export type Offer = {
  id: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  preparationDays: number;
  warranty: string | null;
  status: 'Active' | 'Inactive';
};

export type Variant = {
  id: string;
  sku: string;
  name: string;
  weightGrams: number;
  isActive: boolean;
  sortOrder: number;
  options: SpecValue[];
  offer: Offer | null;
};

export type Product = {
  id: string;
  categoryId: string;
  brandId: string | null;
  title: string;
  englishTitle: string | null;
  slug: string;
  summary: string | null;
  description: string | null;
  status: ProductStatus;
  faraTamasCompatible: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  specs: SpecValue[];
  images: ProductImage[];
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
};
