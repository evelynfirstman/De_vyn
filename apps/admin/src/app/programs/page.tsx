"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  DataTable,
  btnDanger,
  btnPrimary,
  card,
  inputStyle,
} from "@/components/DataTable";
import { api } from "@/lib/api";

type Program = {
  id: number;
  slug: string;
  title: string;
  level: string;
  duration_min: number;
};

const EMPTY = {
  slug: "",
  title: "",
  description: "",
  level: "beginner",
  durationMin: "12",
  steps: '[{"name": "Step one", "seconds": 60}]',
  problemTags: "neck",
};

export default function ProgramsPage() {
  const [rows, setRows] = useState<Program[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const items = await api<Program[]>("/v1/programs?pageSize=100");
    setRows(items ?? []);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  function payload() {
    return {
      slug: form.slug,
      title: form.title,
      description: form.description,
      level: form.level,
      durationMin: Number(form.durationMin),
      steps: JSON.parse(form.steps) as unknown,
      problemTags: form.problemTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  async function save() {
    setError(null);
    try {
      if (editing === null) {
        await api("/v1/admin/programs", {
          method: "POST",
          body: JSON.stringify(payload()),
        });
      } else {
        await api(`/v1/admin/programs/${editing}`, {
          method: "PUT",
          body: JSON.stringify(payload()),
        });
      }
      setForm(EMPTY);
      setEditing(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api(`/v1/admin/programs/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <AdminShell title="Programs">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          { key: "slug", label: "Slug" },
          { key: "title", label: "Title" },
          { key: "level", label: "Level" },
          { key: "duration_min", label: "Min" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <>
                <button
                  style={btnPrimary}
                  onClick={() => {
                    const p = r as unknown as Program;
                    setEditing(p.id);
                    setForm({
                      slug: p.slug,
                      title: p.title,
                      description: "",
                      level: p.level,
                      durationMin: String(p.duration_min),
                      steps: "[]",
                      problemTags: "",
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  style={btnDanger}
                  onClick={() => void remove(r.id as number)}
                >
                  Delete
                </button>
              </>
            ),
          },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
      <h3>{editing === null ? "New program" : `Edit #${editing}`}</h3>
      <div style={card}>
        {(
          [
            "slug",
            "title",
            "description",
            "level",
            "durationMin",
            "steps",
            "problemTags",
          ] as const
        ).map((k) => (
          <input
            key={k}
            style={inputStyle}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k}
          />
        ))}
        <button style={btnPrimary} onClick={() => void save()}>
          {editing === null ? "Create" : "Update"}
        </button>
        {editing !== null ? (
          <button
            style={btnPrimary}
            onClick={() => {
              setEditing(null);
              setForm(EMPTY);
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </AdminShell>
  );
}
