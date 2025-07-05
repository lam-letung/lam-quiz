import { Link } from "react-router-dom";
import { BookOpen, Github, Twitter, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-primary"
            >
              <div className="p-2 rounded-lg gradient-bg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              lam-quiz
            </Link>
            <p className="text-sm text-muted-foreground">
              Master any subject with our intelligent flashcard system. Track
              your progress, earn points, and level up your learning experience.
            </p>
          </div>

          {/* Study */}
          <div className="space-y-4">
            <h3 className="font-semibold">Study</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/study"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Flashcards
                </Link>
              </li>
              <li>
                <Link
                  to="/test"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link
                  to="/match"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Match Game
                </Link>
              </li>
              <li>
                <Link
                  to="/progress"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Progress Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Create */}
          <div className="space-y-4">
            <h3 className="font-semibold">Create</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/create"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  New Study Set
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Import Cards
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Export Data
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Templates
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© 2024 lam-quiz. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500" /> by lam-letung
            </span>
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
