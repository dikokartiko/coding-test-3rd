"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  MessageSquare,
  BarChart3,
  FileText,
  GitMerge,
  Calculator,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/funds", label: "Funds", icon: BarChart3 },
  { href: "/funds/compare", label: "Compare", icon: GitMerge },
  { href: "/formulas", label: "Formulas", icon: Calculator },
  { href: "/documents", label: "Documents", icon: FileText },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Fund Analysis
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on tablet and mobile */}
          <div className="hidden lg:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Tablet and Mobile Navigation */}
          <div className="lg:hidden relative">
            <input type="checkbox" id="mobile-menu" className="hidden peer" />
            <label
              htmlFor="mobile-menu"
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </label>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-lg rounded-md py-2 hidden peer-checked:block z-50 border">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
