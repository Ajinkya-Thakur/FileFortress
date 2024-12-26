import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white px-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl font-bold tracking-tight">
            FileFortress
          </h1>
          <p className="text-2xl text-blue-100">
            Your Fortress for Secure File Storage
          </p>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
            <p className="text-blue-100">Your files are encrypted before they leave your device.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Two-Factor Auth</h3>
            <p className="text-blue-100">Extra layer of security for your peace of mind.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Secure Sharing</h3>
            <p className="text-blue-100">Share files securely with customizable access controls.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-8">
          <div className="flex gap-6 justify-center">
            <Link to="/login">
              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105">
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200 transform hover:scale-105">
                Get Started
              </button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>Military-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>Unlimited Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 