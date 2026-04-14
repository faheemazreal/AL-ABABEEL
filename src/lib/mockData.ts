import {
  UserRole,
  RequestCategory,
  Urgency,
  RequestStatus,
  AppUser,
  CharityRequest,
  Donation,
  Verification
} from '../types';

export const MOCK_USERS: AppUser[] = [
  {
    uid: 'user_1',
    displayName: 'Hisham',
    email: 'crazyhisham15@gmail.com',
    photoURL: 'https://picsum.photos/seed/hisham/200/200',
    role: 'donor',
    reputation: 150,
    upiId: 'hisham@okaxis'
  },
  {
    uid: 'user_2',
    displayName: 'Rahul Sharma',
    email: 'rahul@example.com',
    photoURL: 'https://picsum.photos/seed/rahul/200/200',
    role: 'requester',
    reputation: 45,
    upiId: 'rahul@okicici'
  },
  {
    uid: 'user_3',
    displayName: 'Priya Patel',
    email: 'priya@example.com',
    photoURL: 'https://picsum.photos/seed/priya/200/200',
    role: 'eyewitness',
    reputation: 85
  }
];

export const MOCK_REQUESTS: CharityRequest[] = [
  {
    id: 'req_1',
    requesterId: 'user_2',
    requesterName: 'Rahul Sharma',
    title: 'Emergency Food for 50 Laborers',
    description: 'Due to sudden factory closure, 50 families are without food. We need urgent rations for 1 week.',
    category: 'Food',
    targetAmount: 15000,
    raisedAmount: 4500,
    neededItems: [
      { name: 'Meal Kits', total: 50, fulfilled: 12 },
      { name: 'Water Cartons', total: 20, fulfilled: 5 }
    ],
    urgency: 'High',
    status: 'Verified',
    location: { lat: 12.9716, lng: 77.5946, address: 'Majestic, Bangalore' },
    proofUrls: ['https://picsum.photos/seed/food1/800/600', 'https://picsum.photos/seed/food2/800/600'],
    createdAt: Date.now() - 172800000
  },
  {
    id: 'req_2',
    requesterId: 'user_4',
    requesterName: 'Suresh Kumar',
    title: 'Medical Bills for Heart Surgery',
    description: 'My father needs urgent bypass surgery. We have managed 70% of the funds, need help with the remaining.',
    category: 'Medical',
    targetAmount: 200000,
    raisedAmount: 120000,
    neededItems: [
      { name: 'Surgery Kit', total: 1, fulfilled: 0 },
      { name: 'Post-op Meds', total: 10, fulfilled: 3 }
    ],
    urgency: 'High',
    status: 'Pending',
    location: { lat: 13.0827, lng: 80.2707, address: 'Apollo Hospital, Chennai' },
    proofUrls: ['https://picsum.photos/seed/med1/800/600'],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'req_3',
    requesterId: 'user_5',
    requesterName: 'Anita Devi',
    title: 'Books and Bags for Village School',
    description: '30 children in our village school don\'t have basic stationery. Help us empower their education.',
    category: 'Education',
    targetAmount: 5000,
    raisedAmount: 4800,
    neededItems: [
      { name: 'School Bags', total: 30, fulfilled: 28 },
      { name: 'Stationery Kits', total: 30, fulfilled: 25 }
    ],
    urgency: 'Medium',
    status: 'Completed',
    location: { lat: 19.0760, lng: 72.8777, address: 'Dharavi, Mumbai' },
    proofUrls: ['https://picsum.photos/seed/edu1/800/600'],
    createdAt: Date.now() - 432000000
  }
];

export const MOCK_DONATIONS: Donation[] = [
  {
    id: 'don_1',
    requestId: 'req_1',
    donorId: 'user_1',
    donorName: 'Hisham',
    amount: 500,
    transactionId: 'TXN987654321',
    timestamp: Date.now() - 3600000
  }
];

export const MOCK_VERIFICATIONS: Verification[] = [
  {
    id: 'ver_1',
    requestId: 'req_1',
    verifierId: 'user_3',
    verifierName: 'Priya Patel',
    photoUrl: 'https://picsum.photos/seed/verify1/800/600',
    location: { lat: 12.9717, lng: 77.5947 },
    timestamp: Date.now() - 86400000,
    status: 'Approved',
    notes: 'Visited the site. The families are indeed in distress. Verified their IDs and current situation.'
  }
];

export const MOCK_VENDORS: any[] = [
  {
    id: 'vendor_1',
    name: 'Annapurna Kitchen',
    category: 'Food',
    rating: 4.8,
    distance: '1.2 km',
    items: [{ name: 'Meal Kit (Family)', price: 250 }, { name: 'Rice Bag (5kg)', price: 450 }],
    upiId: 'annapurna@okaxis'
  },
  {
    id: 'vendor_2',
    name: 'City Pharmacy',
    category: 'Medical',
    rating: 4.5,
    distance: '0.8 km',
    items: [{ name: 'Medicine Kit', price: 1200 }, { name: 'First Aid Box', price: 350 }],
    upiId: 'citypharmacy@okicici'
  },
  {
    id: 'vendor_3',
    name: 'Vidya Stationery',
    category: 'Education',
    rating: 4.2,
    distance: '2.5 km',
    items: [{ name: 'School Bag', price: 350 }, { name: 'Stationery Kit', price: 150 }],
    upiId: 'vidya@okaxis'
  },
  {
    id: 'vendor_4',
    name: 'Bismillah Hot Meals',
    category: 'Food',
    rating: 4.9,
    distance: '0.5 km',
    items: [{ name: 'Biryani Pack (10 People)', price: 800 }, { name: 'Water Bottles (Case)', price: 120 }],
    upiId: 'bismillah@okhdfc'
  },
  {
    id: 'vendor_5',
    name: 'CarePlus Medical Store',
    category: 'Medical',
    rating: 4.7,
    distance: '3.1 km',
    items: [{ name: 'Surgical Equipment', price: 2500 }, { name: 'Wheelchair Rental (Month)', price: 1500 }],
    upiId: 'careplus@okaxis'
  },
  {
    id: 'vendor_6',
    name: 'Saraswati Book Depot',
    category: 'Education',
    rating: 4.4,
    distance: '1.8 km',
    items: [{ name: 'Textbook Set (Class 5)', price: 600 }, { name: 'Notebooks (Dozen)', price: 200 }],
    upiId: 'saraswati@okaxis'
  },
  {
    id: 'vendor_7',
    name: 'Fresh Market Groceries',
    category: 'Food',
    rating: 4.6,
    distance: '1.0 km',
    items: [{ name: 'Ration Kit (Month)', price: 1500 }, { name: 'Cooking Oil (5L)', price: 650 }],
    upiId: 'freshmarket@okicici'
  },
  {
    id: 'vendor_8',
    name: 'Relief Surgical & Pharma',
    category: 'Medical',
    rating: 4.8,
    distance: '4.2 km',
    items: [{ name: 'Post-op Recovery Kit', price: 3000 }, { name: 'Orthopedic Belt', price: 800 }],
    upiId: 'relief@okhdfc'
  },
  {
    id: 'vendor_9',
    name: 'Global Uniforms & Gear',
    category: 'Education',
    rating: 4.5,
    distance: '3.0 km',
    items: [{ name: 'School Uniform Set', price: 850 }, { name: 'Winter Jacket (Kids)', price: 500 }],
    upiId: 'global@okaxis'
  },
  {
    id: 'vendor_10',
    name: 'Nourish Cafe & Catering',
    category: 'Food',
    rating: 4.7,
    distance: '2.1 km',
    items: [{ name: 'Bulk Meal Boxes (50)', price: 2500 }, { name: 'Breakfast Packs (20)', price: 600 }],
    upiId: 'nourish@okicici'
  }
];
