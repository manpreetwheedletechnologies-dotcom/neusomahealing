"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  createEnquiry,
} from "@/lib/contact-api";

import {
  buttonDark,
} from "@/lib/ui";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactFormErrors =
  Partial<
    Record<
      keyof ContactFormState,
      string
    >
  >;

const initialForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-gold focus:ring-2 focus:ring-[#cda968]/15";

function validateForm(
  form: ContactFormState,
): ContactFormErrors {
  const errors:
    ContactFormErrors = {};

  const name =
    form.name.trim();

  const email =
    form.email.trim();

  const phone =
    form.phone.trim();

  const subject =
    form.subject.trim();

  const message =
    form.message.trim();

  if (name.length < 2) {
    errors.name =
      "Please enter your name.";
  }

  if (
    !/^\S+@\S+\.\S+$/.test(
      email,
    )
  ) {
    errors.email =
      "Please enter a valid email address.";
  }

  if (
    phone &&
    !/^[0-9+()\-\s]{7,24}$/.test(
      phone,
    )
  ) {
    errors.phone =
      "Please enter a valid phone number.";
  }

  if (subject.length < 2) {
    errors.subject =
      "Please enter a subject.";
  }

  if (message.length < 10) {
    errors.message =
      "Please enter at least 10 characters in your message.";
  }

  return errors;
}

export function ContactForm() {
  const [form, setForm] =
    useState<ContactFormState>(
      initialForm,
    );

  const [errors, setErrors] =
    useState<ContactFormErrors>(
      {},
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const updateField = (
    field:
      keyof ContactFormState,

    value: string,
  ) => {
    setForm(
      (current) => ({
        ...current,

        [field]: value,
      }),
    );

    setErrors(
      (current) => ({
        ...current,

        [field]:
          undefined,
      }),
    );

    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");
    setSuccessMessage("");

    const validationErrors =
      validateForm(form);

    setErrors(
      validationErrors,
    );

    if (
      Object.keys(
        validationErrors,
      ).length > 0
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        await createEnquiry({
          name:
            form.name.trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          phone:
            form.phone.trim() ||
            undefined,

          subject:
            form.subject.trim(),

          message:
            form.message.trim(),
        });

      setForm(
        initialForm,
      );

      setErrors({});

      setSuccessMessage(
        response.message,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      noValidate
      className="relative space-y-4 overflow-hidden rounded-[22px] border border-line bg-[#fffaf3] p-8"
    >
      {/* NAME */}

      <div>
        <input
          type="text"
          name="name"
          autoComplete="name"
          maxLength={80}
          aria-label="Your Name"
          aria-invalid={
            Boolean(
              errors.name,
            )
          }
          value={
            form.name
          }
          onChange={(
            event,
          ) =>
            updateField(
              "name",
              event
                .target
                .value,
            )
          }
          className={
            fieldClass
          }
          placeholder="Your Name"
        />

        {errors.name && (
          <p className="mt-1.5 text-xs text-[#8b4636]">
            {
              errors.name
            }
          </p>
        )}
      </div>

      {/* EMAIL */}

      <div>
        <input
          type="email"
          name="email"
          autoComplete="email"
          maxLength={160}
          aria-label="Email Address"
          aria-invalid={
            Boolean(
              errors.email,
            )
          }
          value={
            form.email
          }
          onChange={(
            event,
          ) =>
            updateField(
              "email",
              event
                .target
                .value,
            )
          }
          className={
            fieldClass
          }
          placeholder="Email Address"
        />

        {errors.email && (
          <p className="mt-1.5 text-xs text-[#8b4636]">
            {
              errors.email
            }
          </p>
        )}
      </div>

      {/* PHONE */}

      <div>
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          maxLength={24}
          aria-label="Phone Number"
          aria-invalid={
            Boolean(
              errors.phone,
            )
          }
          value={
            form.phone
          }
          onChange={(
            event,
          ) =>
            updateField(
              "phone",
              event
                .target
                .value,
            )
          }
          className={
            fieldClass
          }
          placeholder="Phone Number"
        />

        {errors.phone && (
          <p className="mt-1.5 text-xs text-[#8b4636]">
            {
              errors.phone
            }
          </p>
        )}
      </div>

      {/* SUBJECT */}

      <div>
        <input
          type="text"
          name="subject"
          maxLength={120}
          aria-label="Subject"
          aria-invalid={
            Boolean(
              errors.subject,
            )
          }
          value={
            form.subject
          }
          onChange={(
            event,
          ) =>
            updateField(
              "subject",
              event
                .target
                .value,
            )
          }
          className={
            fieldClass
          }
          placeholder="Subject"
        />

        {errors.subject && (
          <p className="mt-1.5 text-xs text-[#8b4636]">
            {
              errors.subject
            }
          </p>
        )}
      </div>

      {/* MESSAGE */}

      <div>
        <textarea
          name="message"
          maxLength={2000}
          aria-label="Your Message"
          aria-invalid={
            Boolean(
              errors.message,
            )
          }
          value={
            form.message
          }
          onChange={(
            event,
          ) =>
            updateField(
              "message",
              event
                .target
                .value,
            )
          }
          className={`${fieldClass} h-32 resize-none`}
          placeholder="Your Message"
        />

        <div className="mt-1.5 flex items-start justify-between gap-3">

          <div>
            {errors.message && (
              <p className="text-xs text-[#8b4636]">
                {
                  errors.message
                }
              </p>
            )}
          </div>

          <p className="shrink-0 text-[10px] text-muted">
            {
              form.message
                .length
            }
            /2000
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
        disabled={
          isSubmitting
        }
        className={`${buttonDark} w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isSubmitting
          ? "Sending Message..."
          : "Send Message"}
      </button>
    </form>
  );
}