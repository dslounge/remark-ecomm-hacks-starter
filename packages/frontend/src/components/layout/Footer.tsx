import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-white font-bold text-lg">
                SG
              </div>
              <span className="text-lg font-bold text-gray-900">Summit Gear Co.</span>
            </div>
            <p className="text-gray-600 text-sm">
              Quality outdoor equipment for every adventure.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="text-gray-600 hover:text-forest-700">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/category/camping-hiking" className="text-gray-600 hover:text-forest-700">
                  Camping & Hiking
                </Link>
              </li>
              <li>
                <Link to="/category/climbing" className="text-gray-600 hover:text-forest-700">
                  Climbing
                </Link>
              </li>
              <li>
                <Link to="/category/apparel" className="text-gray-600 hover:text-forest-700">
                  Apparel
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-forest-700">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Summit Gear Co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
