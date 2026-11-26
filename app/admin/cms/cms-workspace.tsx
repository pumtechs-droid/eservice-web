"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import styles from "./cms.module.css";

type CmsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CmsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  status: CmsStatus;
  updatedAt: string;
};

type CmsWorkspaceProps = {
  adminName: string;
  initialItems: CmsItem[];
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CmsWorkspace({
  adminName,
  initialItems,
}: CmsWorkspaceProps) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<CmsStatus>("DRAFT");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [isSaving, setIsSaving] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, excerpt, body, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save this content.");
      }

      const created = result.content as CmsItem;
      setItems((current) => [created, ...current]);
      setTitle("");
      setSlug("");
      setSlugEdited(false);
      setExcerpt("");
      setBody("");
      setStatus("DRAFT");
      setMessageType("success");
      setMessage("Content saved successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save this content. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const publishedCount = items.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  return (
    <>
      <section className={styles.welcome}>
        <div>
          <p className={styles.welcomeEyebrow}>CONTENT STUDIO</p>
          <h2>Manage your website content</h2>
          <p>
            Create clear updates for customers, save drafts, and publish
            approved content to the public website.
          </p>
        </div>
        <div className={styles.welcomeBadge}>
          <span className={styles.badgeIcon}>✦</span>
          <span>
            <strong>{adminName}</strong>
            <small>Content administrator</small>
          </span>
        </div>
      </section>

      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          className={`${styles.message} ${
            messageType === "error" ? styles.errorMessage : styles.successMessage
          }`}
        >
          {message}
        </p>
      )}

      <div className={styles.workspace}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.eyebrow}>NEW ARTICLE</span>
            <h2>Create content</h2>
            <p>Enter the details below. You can save it as a draft or publish it.</p>
          </div>

          <form onSubmit={create} className={styles.form}>
            <label className={styles.field}>
              <span>Title <em>Required</em></span>
              <input
                value={title}
                onChange={(event) => {
                  const value = event.target.value;
                  setTitle(value);
                  if (!slugEdited) setSlug(createSlug(value));
                }}
                maxLength={160}
                placeholder="e.g. Our new customer service hours"
                required
              />
            </label>

            <label className={styles.field}>
              <span>URL slug <em>Required</em></span>
              <div className={styles.slugInput}>
                <span>eservicehub.co.ke/cms/</span>
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(createSlug(event.target.value));
                  }}
                  maxLength={160}
                  placeholder="article-url"
                  aria-label="URL slug"
                  required
                />
              </div>
              <small>Use lowercase letters, numbers, and hyphens.</small>
            </label>

            <label className={styles.field}>
              <span>Summary <small>Optional</small></span>
              <textarea
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                maxLength={300}
                rows={3}
                placeholder="A short introduction shown in the content listing."
              />
            </label>

            <label className={styles.field}>
              <span>Article content <em>Required</em></span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                minLength={10}
                rows={8}
                placeholder="Write the full content here..."
                required
              />
            </label>

            <label className={styles.field}>
              <span>Publication status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CmsStatus)
                }
              >
                <option value="DRAFT">Draft — only visible to admins</option>
                <option value="PUBLISHED">Published — visible to everyone</option>
                <option value="ARCHIVED">Archived — hidden from the site</option>
              </select>
            </label>

            <div className={styles.formFooter}>
              <p>Content is saved securely in the E-SERVICE HUB CMS.</p>
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save content"}
                {!isSaving && <span aria-hidden="true">→</span>}
              </button>
            </div>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.eyebrow}>CONTENT LIBRARY</span>
            <div className={styles.libraryTitle}>
              <div>
                <h2>Your content</h2>
                <p>Review saved articles and their publication status.</p>
              </div>
              <span className={styles.countBadge}>{items.length}</span>
            </div>
          </div>

          <div className={styles.librarySummary}>
            <span>{items.length} total items</span>
            <span>{publishedCount} published</span>
          </div>

          {items.length > 0 ? (
            <ul className={styles.contentList}>
              {items.map((item) => (
                <li key={item.id} className={styles.contentItem}>
                  <div className={styles.itemHeading}>
                    <h3>{item.title}</h3>
                    <span
                      className={`${styles.status} ${
                        styles[item.status.toLowerCase() as Lowercase<CmsStatus>]
                      }`}
                    >
                      {item.status.toLowerCase()}
                    </span>
                  </div>
                  <p className={styles.itemSlug}>/cms/{item.slug}</p>
                  {item.excerpt && (
                    <p className={styles.itemExcerpt}>{item.excerpt}</p>
                  )}
                  <div className={styles.itemFooter}>
                    <span>Updated {formatDate(item.updatedAt)}</span>
                    {item.status === "PUBLISHED" && (
                      <Link href={`/cms/${item.slug}`} target="_blank">
                        View live ↗
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>✎</span>
              <h3>Your library is empty</h3>
              <p>
                Create your first update using the form. It will appear here
                once saved.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
