export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-12 text-center max-w-md">
        <h1
          className="text-navy text-2xl font-bold mb-3"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Checkout Coming in Step 3
        </h1>
        <p className="text-gray-500 text-sm">
          Stripe payment integration will be wired up here.
        </p>
      </div>
    </div>
  );
}
