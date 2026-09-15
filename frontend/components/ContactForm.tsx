"use client";

import { FormEvent, ReactNode, useState } from "react";
import { createEnquiry } from "@/lib/contact-api";
import { buttonDark } from "@/lib/ui";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

const initialForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const fieldClass =
  "w-full rounded-xl border border-line bg-[#fdfaf3] px-4 py-4 text-sm text-[#2c3a34] outline-none transition placeholder:text-[#8a9188] focus:border-gold focus:ring-2 focus:ring-[#cda968]/15";

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-medium text-[#4b564f]"
    >
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

function validateForm(form: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  // NAME: letters, spaces, apostrophes, hyphens only — 2 to 60 chars
  if (name.length < 2) {
    errors.name = "Please enter your name.";
  } else if (name.length > 60) {
    errors.name = "Name should be under 60 characters.";
  } else if (!/^[A-Za-z\u00C0-\u024F' -]+$/.test(name)) {
    errors.name = "Name can only contain letters, spaces, and hyphens.";
  }

  // EMAIL: standard, more strict pattern
  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (
    !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
      email,
    )
  ) {
    errors.email = "Please enter a valid email address.";
  } else if (email.length > 160) {
    errors.email = "Email should be under 160 characters.";
  }

  // PHONE: required — must be exactly 10 digits
  // (allows an optional +91 / 0 prefix which is stripped before checking)
  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else {
    const digitsOnly = phone.replace(/[\s()-]/g, "");
    const normalized = digitsOnly.replace(/^(\+91|91|0)/, "");

    if (!/^\d+$/.test(digitsOnly.replace(/^\+/, ""))) {
      errors.phone = "Phone number can only contain digits.";
    } else if (normalized.length !== 10) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    } else if (!/^[6-9]\d{9}$/.test(normalized)) {
      errors.phone = "Please enter a valid phone number.";
    }
  }

  // SUBJECT: 3 to 120 chars
  if (subject.length < 3) {
    errors.subject = "Subject should be at least 3 characters.";
  } else if (subject.length > 120) {
    errors.subject = "Subject should be under 120 characters.";
  }

  // MESSAGE: 10 to 2000 chars
  if (message.length < 10) {
    errors.message = "Please enter at least 10 characters in your message.";
  } else if (message.length > 2000) {
    errors.message = "Message should be under 2000 characters.";
  }

  return errors;
}

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError("");
    setSuccessMessage("");

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createEnquiry({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setForm(initialForm);
      setErrors({});
      setSuccessMessage(response.message);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative space-y-5"
    >
      {/* NAME */}
      <div>
        <RequiredLabel htmlFor="name">Your Name</RequiredLabel>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          maxLength={80}
          aria-label="Your Name"
          aria-invalid={Boolean(errors.name)}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          className={fieldClass}
          placeholder="Your Name"
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-[#8b4636]">{errors.name}</p>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <RequiredLabel htmlFor="email">Email Address</RequiredLabel>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          maxLength={160}
          aria-label="Email Address"
          aria-invalid={Boolean(errors.email)}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className={fieldClass}
          placeholder="Email Address"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-[#8b4636]">{errors.email}</p>
        )}
      </div>

      {/* PHONE */}
      <div>
        <RequiredLabel htmlFor="phone">Phone Number</RequiredLabel>
        <input
          type="tel"
          id="phone"
          name="phone"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={17}
          aria-label="Phone Number"
          aria-invalid={Boolean(errors.phone)}
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          className={fieldClass}
          placeholder="Phone Number"
        />
        {errors.phone && (
          <p className="mt-1.5 text-xs text-[#8b4636]">{errors.phone}</p>
        )}
      </div>

      {/* SUBJECT */}
      <div>
        <RequiredLabel htmlFor="subject">Subject</RequiredLabel>
        <input
          type="text"
          id="subject"
          name="subject"
          maxLength={120}
          aria-label="Subject"
          aria-invalid={Boolean(errors.subject)}
          value={form.subject}
          onChange={(event) => updateField("subject", event.target.value)}
          className={fieldClass}
          placeholder="Subject"
        />
        {errors.subject && (
          <p className="mt-1.5 text-xs text-[#8b4636]">{errors.subject}</p>
        )}
      </div>

      {/* MESSAGE */}
      <div>
        <RequiredLabel htmlFor="message">Your Message</RequiredLabel>
        <textarea
          id="message"
          name="message"
          maxLength={2000}
          aria-label="Your Message"
          aria-invalid={Boolean(errors.message)}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className={`${fieldClass} h-40 resize-none`}
          placeholder="Your Message"
        />

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div>
            {errors.message && (
              <p className="text-xs text-[#8b4636]">{errors.message}</p>
            )}
          </div>
          <p className="shrink-0 text-[10px] text-[#8a9188]">
            {form.message.length}/2000
          </p>
        </div>
      </div>

      {/* ERROR */}
      {submitError && (
        <p
          role="alert"
          className="rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs leading-5 text-[#8b4636]"
        >
          {submitError}
        </p>
      )}

      {/* SUCCESS */}
      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-[#b8d1c5] bg-[#f3faf6] px-4 py-3 text-xs leading-5 text-[#315f4e]"
        >
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${buttonDark} w-full justify-center rounded-xl py-4 text-base disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isSubmitting ? "Sending Message..." : "Send Message"}
      </button>
    </form>
  );
}