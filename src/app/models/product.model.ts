export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  category: Category;
  stock?: number;
  rating?: number;
  discountPercentage?: number;
  createdAt?: string | Date;
  popularity?: number;
  [key: string]: any; 
}
