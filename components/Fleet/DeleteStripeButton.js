"use client";
import { useState } from "react";

export default function DeleteStripeButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/fleet/delete-stripe", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: "Stripe account deleted successfully!",
          log: data.log,
        });
        setShowConfirm(false);
        // Refresh the page after 2 seconds to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to delete Stripe account",
          log: data.log,
        });
        setShowConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting Stripe account:", error);
      setMessage({
        type: "error",
        text: "An error occurred while deleting the Stripe account",
      });
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900 mb-1">
            🧪 Test: Delete Stripe Account
          </h4>
          <p className="text-xs text-red-700 mb-2">
            This will permanently delete your Stripe account from Stripe and clear
            it from the database. Use only for testing purposes.
          </p>
          {message && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="font-medium">{message.text}</p>
              {message.log && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">View details</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                    {message.log.join("\n")}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {showConfirm ? (
            <>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setMessage(null);
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Confirm Delete"}
              </button>
            </>
          ) : (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Delete Stripe Account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}





