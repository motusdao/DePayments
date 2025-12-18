import Link from 'next/link'
import { Home, Users, Wallet, User, CreditCard, Settings, Calendar, Star, FileCheck, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';

// Navigation items for Users (Patients)
const userNavItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/psms', icon: Users, label: 'Find Therapist' },
  { path: '/sessions', icon: Calendar, label: 'My Sessions' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/current-hire', icon: User, label: 'My Therapist' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/profile', icon: Settings, label: 'Profile' },
];

// Navigation items for PSMs (Therapists)
const psmNavItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/certifications', icon: FileCheck, label: 'Certification' },
  { path: '/sessions', icon: Calendar, label: 'My Sessions' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/psms-register', icon: UserPlus, label: 'PSM Management' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/profile', icon: Settings, label: 'Profile' },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { offChainUserData, getUserRole } = useUserManagement();
  
  // Determine which nav items to show based on user role
  const userRole = getUserRole();
  const isPSM = offChainUserData?.isPSM || userRole === 'PSM';
  const navItems = isPSM ? psmNavItems : userNavItems;
  
  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  return (
    <>
      <div
        className={
          `z-40 w-64 h-screen bg-white/90 shadow-xl border border-gray-100 rounded-2xl flex flex-col pt-8 pb-6 px-2
          transition-transform duration-300
          fixed top-0 left-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:flex`
        }
        style={{ minHeight: '100vh', marginTop: '1rem', marginLeft: '1rem' }}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 md:hidden text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <div className="p-6 flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <img src="/logodapp.svg" alt="App Logo" className="h-10 w-10 mr-3" />
            <h1 className="text-lg font-bold" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', fontSize: '1.55rem', color: '#222' }}>
              MotusDAO
            </h1>
          </div>
          <p className="text-sm text-gray-400 text-center" style={{ fontFamily: 'JURA, Arial, Helvetica, sans-serif' }}>Payments Dashboard</p>
        </div>
        <nav className="mt-8 flex-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              href={path}
              className={
                `group flex items-center px-7 py-3 my-1 text-base font-medium rounded-xl transition-colors gap-3 ${
                  path === pathname
                    ? 'bg-[#f7f7f8] text-[#635BFF] font-bold shadow-sm'
                    : 'text-[#222] hover:text-[#635BFF] hover:bg-[#f7f7f8]'
                }`
              }
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              onClick={onClose} // close sidebar on nav click (mobile)
            >
              <Icon className={`w-5 h-5 ${path === pathname ? 'text-[#635BFF]' : 'text-[#bdbdbd] group-hover:text-[#635BFF]'}`} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
      </div>
    </>
  );
}
 