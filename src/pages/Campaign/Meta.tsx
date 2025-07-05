import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
// import confetti from "canvas-confetti";
import ConfettiAnimation from "./confetti";

const costPerLead = 250;
const minAmount = 5000;
const maxAmount = 100000;

const durationOptions = [
  "1 Week",
  "2 Weeks",
  "1 Month",
  "2 Months",
  "3 Months",
];
const steps = ["Budget & Leads", "Duration"];

type Transaction = {
  txnid: string;
  amount: number;
  leads: number;
  duration: string;
  costPerLead: number;
  timestamp: string;
  campaignType: string;
  status: string;
  userId?: string;
  userPhone?: string | null;
  userName?: string | null;
};

const Meta = () => {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(10000);
  const [leads, setLeads] = useState(Math.floor(amount / costPerLead));
  const [selectedDuration, setSelectedDuration] = useState("1 Week");
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "error" | null
  >(null);
  const [transactionData, setTransactionData] = useState<Transaction | null>(
    null
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousCampaigns, setPreviousCampaigns] = useState<Transaction[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchPreviousCampaigns = async () => {
      if (!user?.phoneNumber) return;

      const sanitizedPhone = user.phoneNumber.replace(/[^\d]/g, "");
      const transactionsRef = collection(
        db,
        `crm_users/${sanitizedPhone}/transactions`
      );

      const snapshot = await getDocs(transactionsRef);
      const campaigns = snapshot.docs.map((doc) => doc.data() as Transaction);

      setPreviousCampaigns(
        campaigns.filter((txn) => txn.campaignType === "Meta")
      );
    };

    fetchPreviousCampaigns();
  }, [user]);

  const handlePaymentSuccess = useCallback(
    async (txnid: string) => {
      try {
        setLoading(true);

        const transaction: Transaction = {
          txnid,
          amount,
          leads,
          duration: selectedDuration,
          costPerLead,
          timestamp: new Date().toISOString(),
          campaignType: "Meta",
          status: "completed",
          userId: user?.uid,
          userPhone: user?.phoneNumber || null,
          userName: user?.displayName || "Unknown User",
        };

        if (user?.phoneNumber) {
          const sanitizedPhone = user.phoneNumber.replace(/[^\d]/g, "");

          const transactionRef = doc(
            db,
            `crm_users/${sanitizedPhone}/transactions`,
            txnid
          );
          await setDoc(transactionRef, transaction);
        }

        setTransactionData(transaction);
        setPaymentStatus("success");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } catch (error) {
        console.error("Error saving transaction:", error);
        setPaymentStatus("error");
      } finally {
        setLoading(false);
      }
    },
    [amount, leads, selectedDuration, user]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const txnid = params.get("txnid");

    if (status === "success" && txnid && user) {
      handlePaymentSuccess(txnid);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, user, handlePaymentSuccess]);

  const handlePayNow = async () => {
    if (!user) {
      alert("Please sign in to make a payment");
      return;
    }

    const txnid = "TXN" + Date.now();
    const productinfo = "Meta Campaign";
    const firstname = "Ashish";
    const email = user.email || "ashish@example.com";
    const phone = user.phoneNumber || "9999999999";

    // Replace with your actual cloud function URLs
    // const surl = `https://asia-south1-starzapp.cloudfunctions.net/payu-server/payu/webhook/success?user=${user.phoneNumber}&txnid=${txnid}`;
    const surl = `https://asia-south1-starzapp.cloudfunctions.net/payu-server/payu/redirect?txnid=${txnid}`;
    const furl = `https://asia-south1-starzapp.cloudfunctions.net/payu-server/payu/webhook/failure`;

    try {
      const res = await fetch(
        "https://asia-south1-starzapp.cloudfunctions.net/payu-server/payu/payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txnid,
            // amount: amount.toFixed(2),
            amount: 1.0,
            firstname,
            email,
            phone,
            productinfo,
            surl,
            furl,
            userPhone: user.phoneNumber,
          }),
        }
      );

      const { paymentUrl, payload } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;

      for (const key in payload) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
      setPaymentStatus("error");
    }
  };

  const handleAmountChange = (val: number | number[]) => {
    const value = Array.isArray(val) ? val[0] : val;
    setAmount(value);
    setLeads(Math.floor(value / costPerLead));
  };

  const handleLeadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const leadsVal = parseInt(e.target.value) || minAmount / costPerLead;
    const cappedLeads = Math.max(
      Math.floor(minAmount / costPerLead),
      Math.min(leadsVal, Math.floor(maxAmount / costPerLead))
    );
    setLeads(cappedLeads);
    setAmount(cappedLeads * costPerLead);
  };

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const launchCampaign = () => {
    setCampaignLaunched(true);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="budget-leads"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                💰 Set Your Budget
              </h2>
              <div className="text-3xl font-bold text-blue-600">
                ₹{amount.toLocaleString()}
              </div>
            </div>

            <div className="space-y-6">
              <Slider
                min={minAmount}
                max={maxAmount}
                step={500}
                value={amount}
                onChange={handleAmountChange}
                trackStyle={{ backgroundColor: "#3b82f6", height: 10 }}
                handleStyle={{
                  borderColor: "#3b82f6",
                  borderWidth: 3,
                  height: 28,
                  width: 28,
                  backgroundColor: "white",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
                railStyle={{ height: 10, backgroundColor: "#e5e7eb" }}
              />

              <div className="flex justify-between text-gray-600 text-sm">
                <span>₹{minAmount.toLocaleString()}</span>
                <span>₹{maxAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                🎯 Estimated Leads
              </h2>
              <div className="flex justify-center">
                <input
                  type="number"
                  min={Math.floor(minAmount / costPerLead)}
                  max={Math.floor(maxAmount / costPerLead)}
                  value={leads}
                  onChange={handleLeadInputChange}
                  className="border-2 border-blue-200 rounded-lg px-6 py-3 w-40 text-center text-xl font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="text-center text-gray-500 mt-2 text-sm">
                Approximately ₹{costPerLead} per lead
              </p>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="duration"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                ⏳ Campaign Duration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {durationOptions.map((duration) => (
                  <motion.div
                    key={duration}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDuration(duration)}
                    className={`cursor-pointer px-5 py-4 rounded-xl font-medium shadow border-2 transition-all duration-300 flex items-center justify-center ${
                      selectedDuration === duration
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {duration}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-800 font-medium">
                  Selected:{" "}
                  <span className="font-bold">{selectedDuration}</span>
                </p>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const pricingBreakdown = useMemo(() => {
    const adsSpent = amount * 0.8;
    const platformFees = amount * 0.1;
    const professionalFees = amount * 0.1;
    const taxableAmount = adsSpent + platformFees + professionalFees;
    const gst = taxableAmount * 0.18;
    const totalAmount = parseFloat((taxableAmount + gst).toFixed(2));

    return {
      adsSpent,
      platformFees,
      professionalFees,
      gst,
      totalAmount,
    };
  }, [amount]);

  const renderConfirmation = () => {
    const { adsSpent, platformFees, professionalFees, gst, totalAmount } =
      pricingBreakdown;

    const formatCurrency = (value: number) =>
      `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    return (
      <motion.div
        key="confirmation"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">STARZ-Ai Ads 20</h2>
          <p className="text-gray-600 mt-2">
            Review and confirm your campaign details
          </p>
        </div>

        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">Campaign Budget</p>
              <p className="font-semibold">₹{amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Estimated Leads</p>
              <p className="font-semibold">{leads}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Duration</p>
              <p className="font-semibold">{selectedDuration}</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Amount Breakup
        </h3>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₹{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Ads Spent:</span>
            <span className="font-medium">{formatCurrency(adsSpent)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Platform Fees (10%):</span>
            <span className="font-medium">{formatCurrency(platformFees)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Professional Fees (10%):</span>
            <span className="font-medium">
              {formatCurrency(professionalFees)}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">GST (18%):</span>
            <span className="font-medium text-red-600">
              {formatCurrency(gst)}
            </span>
          </div>
          <div className="flex justify-between pt-2 font-semibold text-lg">
            <span className="text-gray-800">Total Amount:</span>
            <span className="text-blue-700">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <motion.button
            onClick={handlePayNow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Pay Now
          </motion.button>
          <button
            onClick={() => setCampaignLaunched(false)}
            className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Edit Campaign Details
          </button>
        </div>
      </motion.div>
    );
  };

  if (!campaignLaunched && previousCampaigns.length > 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">
          📊 Your Meta Campaigns
        </h2>

        <div className="space-y-4">
          {previousCampaigns.map((txn) => (
            <div
              key={txn.txnid}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Txn ID: {txn.txnid}</span>
                <span className="text-green-600 font-semibold">
                  ₹{txn.amount.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                Leads: <b>{txn.leads}</b> | Duration: <b>{txn.duration}</b> |
                Status:{" "}
                <span
                  className={`font-bold ${
                    txn.status === "completed"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setCampaignLaunched(false)}
          className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Start New Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10">
      <AnimatePresence>
        {paymentStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            {showConfetti && <ConfettiAnimation />}

            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-md w-full relative"
            >
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-700">
                    Processing your transaction...
                  </p>
                </div>
              ) : paymentStatus === "success" ? (
                <>
                  <div className="text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-6xl mb-4"
                    >
                      🎉
                    </motion.div>

                    <h2 className="text-2xl font-bold text-green-600 mb-2">
                      Payment Successful!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Your campaign is now live
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                      <p className="font-semibold mb-2">Transaction Details:</p>
                      <p>
                        <span className="text-gray-500">ID:</span>{" "}
                        {transactionData?.txnid}
                      </p>
                      <p>
                        <span className="text-gray-500">Amount:</span> ₹
                        {transactionData?.amount?.toLocaleString()}
                      </p>
                      <p>
                        <span className="text-gray-500">Leads:</span>{" "}
                        {transactionData?.leads}
                      </p>
                      <p>
                        <span className="text-gray-500">Duration:</span>{" "}
                        {transactionData?.duration}
                      </p>
                    </div>

                    <button
                      onClick={() => setPaymentStatus(null)}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continue to Dashboard
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-6xl mb-4 text-red-500">❌</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-2">
                      Payment Failed
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Please try again or contact support
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaymentStatus(null)}
                        className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePayNow}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {campaignLaunched ? (
          renderConfirmation()
        ) : (
          <>
            <motion.div
              key="timeline"
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 z-0"></div>
              <div
                className="absolute top-4 left-0 h-1 bg-blue-600 z-10 transition-all duration-500 ease-out"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              ></div>

              <div className="flex justify-between relative z-20">
                {steps.map((label, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all ${
                        index <= step
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p
                      className={`text-sm font-medium max-w-[120px] text-center px-1 ${
                        index === step
                          ? "text-blue-600 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: step === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === 0 ? 50 : -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                disabled={step === 0}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center font-medium transition-colors"
              >
                <span className="mr-2 text-lg">←</span> Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium transition-colors shadow-md"
                >
                  Continue <span className="ml-2 text-lg">→</span>
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={launchCampaign}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg flex items-center font-bold transition-all"
                >
                  <span className="mr-2">🚀</span> Launch Campaign
                </motion.button>
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Meta;
