import React from 'react';
import { 
  Code2, 
  Zap, 
  Star, 
  Users, 
  Globe, 
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Terminal,
  Cpu,
  Lock,
  GitBranch,
  Workflow,
  Brain,
  Rocket,
  Palette,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Translation",
      description: "Advanced neural networks understand code context and produce human-like translations",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Real-time translation with instant results. No more waiting for code conversion",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Smart Syntax",
      description: "Maintains code style and best practices specific to each programming language",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Error Detection",
      description: "Identifies potential issues and suggests improvements during translation",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "Multi-Language",
      description: "Seamlessly convert between JavaScript, Python, Java, C++ and 10+ other languages",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Production Ready",
      description: "Generate clean, optimized code that's ready for your production environment",
      color: "from-red-500 to-pink-500"
    }
  ];

  const supportedLanguages = [
    { name: "JavaScript", color: "bg-yellow-400" },
    { name: "Python", color: "bg-blue-500" },
    { name: "Java", color: "bg-red-500" },
    { name: "C++", color: "bg-purple-500" },
    { name: "TypeScript", color: "bg-blue-600" },
    { name: "Go", color: "bg-cyan-500" },
    { name: "Rust", color: "bg-orange-600" },
    { name: "Ruby", color: "bg-red-600" },
    { name: "PHP", color: "bg-indigo-500" },
    { name: "Swift", color: "bg-orange-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Code2 className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CodeTranslator
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={scrollToFeatures}
              className="hidden md:inline-flex text-gray-600 hover:text-purple-600 font-medium transition-colors"
            >
              Features
            </button>
            <Link to="/auth/Login">
              <button className="px-5 py-2.5 text-gray-700 hover:text-purple-600 font-medium transition-all">
                Sign In
              </button>
            </Link>
            <Link to="/auth/Register">
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Vibrant Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative">
          

          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Translate Code
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">
                Instantly
              </span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
              Convert code between programming languages with AI-powered precision. 
              Maintain syntax quality and best practices across your entire stack.
            </p>

            <div className="flex items-center justify-center gap-4 mb-16">
              <Link to="/auth/Register">
                <button className="flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all group">
                  Start Translating Now 
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Interactive Code Demo */}
          <div className="max-w-6xl mx-auto transform hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">JavaScript Input</span>
                    </div>
                    <div className="text-xs text-purple-600 font-mono font-semibold">→ Converting</div>
                  </div>
                  <pre className="text-sm font-mono text-gray-800 leading-relaxed bg-white/50 p-4 rounded-lg">
{`// Array manipulation in JS
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(n => n * n);
const even = squared.filter(n => n % 2 === 0);

console.log("Results:", even);`}
                  </pre>
                </div>
                
                <div className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Python Output</span>
                    </div>
                    <div className="text-xs text-green-600 font-mono font-semibold">✓ Converted</div>
                  </div>
                  <pre className="text-sm font-mono text-gray-800 leading-relaxed bg-white/50 p-4 rounded-lg">
{`# Array manipulation in Python
numbers = [1, 2, 3, 4, 5]
squared = [n * n for n in numbers]
even = [n for n in squared if n % 2 == 0]

print("Results:", even)`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Colorful Features Section */}
      <section id="features" className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Developers Love Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make code translation seamless and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-white rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <div className={`w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Support for Popular Languages
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Convert between the programming languages you use every day
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {supportedLanguages.map((lang, index) => (
              <div 
                key={index}
                className="p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all hover:scale-105"
              >
                <div className={`w-4 h-4 rounded-full ${lang.color} mx-auto mb-3`}></div>
                <div className="font-semibold">{lang.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">15+</div>
              <div className="text-gray-600 font-semibold">Languages</div>
            </div>
            <div className="p-6 transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">50K+</div>
              <div className="text-gray-600 font-semibold">Developers</div>
            </div>
            <div className="p-6 transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">1M+</div>
              <div className="text-gray-600 font-semibold">Translations</div>
            </div>
            <div className="p-6 transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">99.9%</div>
              <div className="text-gray-600 font-semibold">Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Code?
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Join thousands of developers who save time and write better code with intelligent translation
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/Register">
              <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-lg font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
                🚀 Start Translating Free
              </button>
            </Link>
          </div>
          <div className="mt-6 text-sm opacity-70">
            No credit card required • Free forever plan • Start in seconds
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Code2 className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold">CodeTranslator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Making code translation accessible and accurate for every developer.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={scrollToFeatures}>Features</button></li>
                <li><a href="#" className="hover:text-white">Languages</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            © 2025 CodeTranslator. Making developers' lives easier, one translation at a time.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;