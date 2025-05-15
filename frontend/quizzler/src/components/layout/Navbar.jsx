import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Quizzler</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/join" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
              Join Game
            </Link>

            {username ? (
              <>
                <span className="px-3 py-2 text-sm font-medium">Hi, {username}</span>

                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-500 hover:bg-indigo-600"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500">
                  Login
                </Link>
                <Link to="/register" className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

