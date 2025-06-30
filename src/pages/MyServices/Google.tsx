import { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { toast } from "react-toastify";

const ServicesGoogle = () => {
  const [loading, setLoading] = useState(true);
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Chart data
  const pieChartData = [
    ["Service", "Usage"],
    ["Search Ads", 45],
    ["Display Ads", 25],
    ["YouTube Ads", 15],
    ["Shopping Ads", 10],
    ["App Campaigns", 5],
  ];

  const barChartData = [
    ["Month", "Impressions", "Clicks"],
    ["Jan", 1000, 400],
    ["Feb", 1170, 460],
    ["Mar", 660, 1120],
    ["Apr", 1030, 540],
    ["May", 1890, 980],
    ["Jun", 2390, 1430],
  ];

  // Service metrics
  const services = [
    { name: "Ad Impressions", value: 124500, target: 200000 },
    { name: "Click Through Rate", value: 4.2, target: 5.0, isPercent: true },
    { name: "Conversions", value: 2450, target: 5000 },
    { name: "Budget Utilization", value: 78, target: 100, isPercent: true },
    { name: "Quality Score", value: 7.8, target: 10 },
    { name: "ROI", value: 3.2, target: 4.0, isPercent: true },
  ];

  // Calculate progress percentage
  const calculatePercentage = (value: number, target: number) => {
    return Math.min(100, Math.round((value / target) * 100));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Google Services Dashboard</h1>
        <p className="text-gray-600">
          Manage and monitor your Google advertising services
        </p>
      </div> */}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading Google services data...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Total Campaigns
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-blue-600">12</span>
                <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  +3 new
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Active Campaigns
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-green-600">8</span>
                <div className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  67% active
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Monthly Spend
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-purple-600">
                  4,250
                </span>
                <div className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  -12% vs last
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-amber-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Avg. Cost/Click
              </h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-amber-600">1.42</span>
                <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  -8% vs last
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Service Distribution
              </h2>
              <Chart
                width={"100%"}
                height={"400px"}
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={pieChartData}
                options={{
                  title: "Google Services Usage",
                  pieHole: 0.4,
                  is3D: false,
                  colors: [
                    "#4285F4",
                    "#34A853",
                    "#FBBC05",
                    "#EA4335",
                    "#8AB4F8",
                  ],
                  backgroundColor: "transparent",
                  legend: {
                    position: "labeled",
                    textStyle: { color: "#4B5563", fontSize: 14 },
                  },
                  titleTextStyle: {
                    color: "#1F2937",
                    fontSize: 18,
                    bold: true,
                  },
                  tooltip: {
                    textStyle: { color: "#1F2937" },
                    showColorCode: true,
                  },
                  pieSliceText: "value",
                  chartArea: { width: "90%", height: "80%" },
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Performance Trends
              </h2>
              <Chart
                width={"100%"}
                height={"400px"}
                chartType="BarChart"
                loader={<div>Loading Chart...</div>}
                data={barChartData}
                options={{
                  title: "Impressions vs Clicks (Last 6 Months)",
                  colors: ["#4285F4", "#34A853"],
                  backgroundColor: "transparent",
                  legend: {
                    position: "top",
                    alignment: "center",
                    textStyle: { color: "#4B5563" },
                  },
                  titleTextStyle: {
                    color: "#1F2937",
                    fontSize: 18,
                    bold: true,
                  },
                  hAxis: {
                    title: "Count",
                    titleTextStyle: { color: "#4B5563" },
                    textStyle: { color: "#4B5563" },
                  },
                  vAxis: {
                    title: "Month",
                    titleTextStyle: { color: "#4B5563" },
                    textStyle: { color: "#4B5563" },
                  },
                  chartArea: { width: "85%", height: "75%" },
                  animation: {
                    startup: true,
                    easing: "linear",
                    duration: 1000,
                  },
                }}
              />
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Service Metrics & Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, index) => {
                const percentage = calculatePercentage(
                  service.value,
                  service.target
                );
                const progressColor =
                  percentage >= 80
                    ? "bg-green-500"
                    : percentage >= 60
                    ? "bg-blue-500"
                    : "bg-yellow-500";

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-700">
                        {service.name}
                      </h3>
                      <span className="text-sm font-semibold">
                        {service.value}
                        {service.isPercent ? "%" : ""}
                        <span className="text-gray-500">
                          {" "}
                          / {service.target}
                          {service.isPercent ? "%" : ""}
                        </span>
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className={`h-2.5 rounded-full ${progressColor}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0%</span>
                      <span>{percentage}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={() => toast.info("🚧 Coming Soon")}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Create New Campaign
            </button>

            <button
              onClick={() => toast.info("🚧 Coming Soon")}
              className="px-6 py-3 bg-white text-gray-800 font-medium rounded-lg shadow border border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Refresh Data
            </button>

            <button
              onClick={() => toast.info("🚧 Coming Soon")}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Optimize Campaigns
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ServicesGoogle;
