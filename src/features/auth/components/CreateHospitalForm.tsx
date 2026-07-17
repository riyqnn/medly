"use client";

import { useState } from "react";
import { createHospitalByAdmin } from "../actions";
import { registerHospitalSchema } from "../schemas";

export function CreateHospitalForm() {
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = registerHospitalSchema.safeParse({
      hospitalName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    const result = await createHospitalByAdmin({ hospitalName, email, password, confirmPassword });
    if (result && !result.success) {
      setError(result.error || "Failed to create hospital");
    } else {
      // Clear form on success
      setHospitalName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      alert("Hospital created successfully!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="hospital" className="label">
          Hospital name
        </label>
        <input
          id="hospital"
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          className="field"
          placeholder="RS Harum Medika"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="label">
          Admin email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="admin@rumahsakit.id"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Repeat password
          </label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Membuat workspace…" : "Buat workspace"}
      </button>
    </form>
  );
}
