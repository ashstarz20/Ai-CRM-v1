import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, addDoc, getFirestore } from "firebase/firestore";

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const query = new URLSearchParams(location.search);

    // Required PayU params (more can be extracted if needed)
    const txnid = query.get("txnid");
    const mihpayid = query.get("mihpayid");
    const statusParam = query.get("status");
    const amount = query.get("amount");
    const email = query.get("email");
    const productinfo = query.get("productinfo");

    const saveToFirestore = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user || !user.phoneNumber) throw new Error("User not logged in");

        const phone = user.phoneNumber.replace("+91", ""); // optional
        const db = getFirestore();

        const paymentRef = collection(db, `crm_users/${phone}/payments`);

        await addDoc(paymentRef, {
          txnid,
          mihpayid,
          amount,
          status: statusParam,
          productinfo,
          email,
          createdAt: new Date(),
        });

        setStatus("success");
      } catch (err) {
        console.error("Failed to save payment:", err);
        setStatus("error");
      }
    };

    if (statusParam === "success") {
      saveToFirestore();
    } else {
      setStatus("error");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      {status === "loading" && (
        <p className="text-gray-600">Saving payment info...</p>
      )}
      {status === "success" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            🎉 Payment Successful
          </h2>
          <p className="text-gray-700">Your campaign is now live!</p>
          <button
            onClick={() => navigate("/meta")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Meta
          </button>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            ❌ Payment Failed
          </h2>
          <p className="text-gray-700">Something went wrong.</p>
          <button
            onClick={() => navigate("/meta")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentResult;
