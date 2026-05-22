export const mockProducts = [
  {
    id: "p1",
    name: "Noir Lace Plunge Set",
    category: "lingerie",
    price: 850000,
    thumbnail: "https://images.unsplash.com/photo-1668191219162-b58465065deb?w=800&q=80",
    description: "An incredibly alluring sheer lace plunge bralette and matching thong set. Crafted from premium French lace for an unforgettable evening.",
    is_age_restricted: true,
    variants: [
      { id: "v1", color: "Black", size: "34A", stock: 5, price: 850000 },
      { id: "v2", color: "Black", size: "34B", stock: 12, price: 850000 },
      { id: "v3", color: "Black", size: "36B", stock: 0, price: 850000 },
      { id: "v4", color: "Red", size: "34B", stock: 3, price: 850000 },
    ]
  },
  {
    id: "p2",
    name: "Crimson Silk Underbust Corset",
    category: "corsets",
    price: 1250000,
    thumbnail: "https://images.unsplash.com/photo-1548568974-a4f8811a4bd0?w=800&q=80",
    description: "Structure and seduction meet in this heavy silk satin underbust corset. Features steel boning for a dramatic hourglass silhouette.",
    is_age_restricted: true,
    variants: [
      { id: "v5", color: "Red", size: "S", stock: 4, price: 1250000 },
      { id: "v6", color: "Red", size: "M", stock: 7, price: 1250000 },
      { id: "v7", color: "Black", size: "S", stock: 2, price: 1250000 },
    ]
  },
  {
    id: "p3",
    name: "Pearl Trim Nightgown",
    category: "sleepwear",
    price: 950000,
    thumbnail: "https://images.unsplash.com/photo-1770294758971-44fa1eae61a3?w=800&q=80",
    description: "Flowing silk nightgown with delicate pearl trim on the straps. Elegance meant for the bedroom.",
    is_age_restricted: false,
    variants: [
      { id: "v8", color: "White", size: "S", stock: 15, price: 950000 },
      { id: "v9", color: "White", size: "M", stock: 8, price: 950000 },
      { id: "v10", color: "Blush", size: "M", stock: 5, price: 950000 },
    ]
  },
  {
    id: "p4",
    name: "Premium Modal Men's Briefs",
    category: "mens",
    price: 350000,
    thumbnail: "https://images.unsplash.com/photo-1601393710008-984348f7447b?w=800&q=80",
    description: "Ultra-soft modal fabric providing exceptional comfort, breathability, and support. Features a sleek, modern cut.",
    is_age_restricted: false,
    variants: [
      { id: "v11", color: "Navy", size: "M", stock: 20, price: 350000 },
      { id: "v12", color: "Navy", size: "L", stock: 22, price: 350000 },
      { id: "v13", color: "Black", size: "M", stock: 15, price: 350000 },
    ]
  },
  {
    id: "p5",
    name: "Velvet Choker & Cuffs Set",
    category: "accessories",
    price: 450000,
    thumbnail: "https://images.unsplash.com/photo-1569388330292-79cc1ec67270?w=800&q=80",
    description: "A sensual addition to any outfit. Plush velvet lined with silk for ultimate comfort during wear.",
    is_age_restricted: true,
    variants: [
      { id: "v14", color: "Black", size: "One Size", stock: 10, price: 450000 },
      { id: "v15", color: "Burgundy", size: "One Size", stock: 6, price: 450000 },
    ]
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
