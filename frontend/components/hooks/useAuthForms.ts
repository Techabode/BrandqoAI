import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const useAuthForm = () => {
  const router = useRouter();

  // Internal state management
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    showPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error for that specific field when user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (mode === "register" && !formData.name.trim())
      newErrors.name = "Name is required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email format";
    if (formData.password.length < 8)
      newErrors.password = "Minimum 8 characters required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Handles secure cookies directly
        body: JSON.stringify(
          mode === "login"
            ? { email: formData.email, password: formData.password }
            : {
                name: formData.name,
                email: formData.email,
                password: formData.password,
              },
        ),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data?.message ?? "Authentication failed");

      if (mode === "register") {
        if (response?.status === 201) {
          setMode("login"); // Switch to login view after success
          setFormData((prev) => ({ ...prev, password: "" })); // Clear sensitive data
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (m: "login" | "register") => {
    setMode(m);
    setErrors({});
    setServerError(null);
  };

  return {
    mode,
    toggleMode,
    formData,
    handleChange,
    handleSubmit,
    loading,
    errors,
    serverError,
    togglePassword: () =>
      setFormData((p) => ({ ...p, showPassword: !p.showPassword })),
  };
};
