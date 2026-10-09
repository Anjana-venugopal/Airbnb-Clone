import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg className="h-8 w-8 text-rose-500 fill-current" viewBox="0 0 32 32">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.479.96 3.327.142 2.449-1.077 4.72-3.149 5.867-1.42.787-3.056.973-4.66.533l-.845-.272c-1.397-.506-2.91-1.385-4.835-2.738-1.926 1.353-3.438 2.232-4.835 2.738l-.845.272c-1.604.44-3.24.254-4.66-.533-2.072-1.147-3.291-3.418-3.149-5.867.05-.848.293-1.736.96-3.327l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.442 0-2.529.742-3.57 2.607l-.547 1.054c-1.933 3.789-6.07 12.449-7.042 14.717-.584 1.394-.787 2.115-.824 2.753-.105 1.815.795 3.486 2.316 4.327 1.066.59 2.308.72 3.513.389.986-.27 2.193-.935 3.864-2.112l.64-.46.65.46c1.671 1.177 2.878 1.842 3.864 2.112 1.205.331 2.447.201 3.513-.389 1.521-.841 2.421-2.512 2.316-4.327-.037-.638-.24-1.359-.824-2.753-.972-2.268-5.109-10.928-7.042-14.717l-.547-1.054C18.529 3.742 17.442 3 16 3zm0 10c2.761 0 5 2.239 5 5 0 2.228-1.458 4.116-3.473 4.757l-.377.103c-.368.093-.752.14-1.15.14-2.761 0-5-2.239-5-5 0-2.761 2.239-5 5-5zm0 2c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3 1.657 0 3-1.343 3-3 0-1.657-1.343-3-3-3z"/>
          </svg>
          <span className="text-rose-500 font-bold text-xl tracking-tight hidden sm:inline">airbnb</span>
        </Link>

        {/* Search Bar Capsule */}
        <div className="flex items-center border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer text-sm font-medium">
          <span className="px-2 border-r border-gray-300">Anywhere</span>
          <span className="px-2 border-r border-gray-300">Any week</span>
          <span className="px-2 text-gray-500">Add guests</span>
          <div className="bg-rose-500 p-2 rounded-full text-white ml-2">
            <Search size={14} strokeWidth={3} />
          </div>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium py-2 px-3 rounded-full hover:bg-gray-100 cursor-pointer hidden md:inline">
            Airbnb your home
          </span>
          <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
            <Globe size={18} />
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-800">
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold px-3 py-1.5 border border-rose-500 text-rose-600 rounded-full hover:bg-rose-50 cursor-pointer transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 border border-gray-300 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer bg-white text-sm font-semibold text-gray-700"
            >
              <UserIcon size={16} />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}