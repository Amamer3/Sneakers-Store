
export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  category: string;
  inStock: boolean;
  featured: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High',
    brand: 'Nike',
    price: 170,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772',
      'https://images.unsplash.com/photo-1556906781-9a412961c28c',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a'
    ],
    description: 'The Air Jordan 1 Retro High remixes the classic design with premium materials and modern comfort.',
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
    category: 'Basketball',
    inStock: true,
    featured: true
  },
  {
    id: '2',
    name: 'Nike Dunk Low',
    brand: 'Nike',
    price: 100,
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519',
    images: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2'
    ],
    description: 'Created for the hardwood but taken to the streets, the Nike Dunk Low returns with crisp overlays.',
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    category: 'Lifestyle',
    inStock: true,
    featured: true
  },
  {
    id: '3',
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    price: 190,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86'
    ],
    description: 'Experience incredible energy return with every step in the Adidas Ultraboost 22.',
    sizes: ['7', '8', '9', '10', '11', '12'],
    category: 'Running',
    inStock: true,
    featured: false
  },
  {
    id: '4',
    name: 'Converse Chuck Taylor All Star',
    brand: 'Converse',
    price: 65,
    image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782',
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86'
    ],
    description: 'The iconic Chuck Taylor All Star sneaker that started it all. Classic, comfortable, and timeless.',
    sizes: ['5', '6', '7', '8', '9', '10', '11', '12'],
    category: 'Lifestyle',
    inStock: true,
    featured: false
  },
  {
    id: '5',
    name: 'Vans Old Skool',
    brand: 'Vans',
    price: 65,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772'
    ],
    description: 'The Vans Old Skool was the first footwear design to showcase the famous Vans Sidestripe.',
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'Skate',
    inStock: true,
    featured: true
  },
  {
    id: '6',
    name: 'New Balance 990v5',
    brand: 'New Balance',
    price: 185,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86',
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa'
    ],
    description: 'The 990v5 is the most refined version of one of our most beloved running shoes.',
    sizes: ['7', '8', '9', '10', '11', '12'],
    category: 'Running',
    inStock: true,
    featured: false
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    userId: '2',
    items: [
      {
        productId: '1',
        name: 'Air Jordan 1 Retro High',
        size: '9',
        quantity: 1,
        price: 170
      }
    ],
    total: 170,
    status: 'delivered',
    createdAt: '2024-05-20T10:30:00Z'
  },
  {
    id: 'order-2',
    userId: '2',
    items: [
      {
        productId: '2',
        name: 'Nike Dunk Low',
        size: '8.5',
        quantity: 2,
        price: 100
      }
    ],
    total: 200,
    status: 'shipped',
    createdAt: '2024-05-25T14:15:00Z'
  }
];

export const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@sneakers.com',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'user@test.com',
    role: 'customer',
    createdAt: '2024-03-15T10:30:00Z'
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'customer',
    createdAt: '2024-04-20T16:45:00Z'
  }
];
