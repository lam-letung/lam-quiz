import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle"; // import nút của bạn

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError(null);
    if (!username || !password) {
      setError("Username và password không được để trống");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        navigate("/login");
      } else {
        const data = await res.json();
        setError(data.error || "Đăng ký thất bại");
      }
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthForm title="Create your account">
     
      {/* Thêm Toggle ở góc trên bên phải */}
      <div className="flex justify-end mb-4">
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Button
          onClick={handleRegister}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Registering…" : "Register"}
        </Button>
      </div>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthForm>
  );
}
