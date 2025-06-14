
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const ServicesApp = () => {
  // Mock data for charts
  const serviceUsageData = [
    { name: 'Jan', usage: 4000 },
    { name: 'Feb', usage: 3000 },
    { name: 'Mar', usage: 2000 },
    { name: 'Apr', usage: 2780 },
    { name: 'May', usage: 1890 },
    { name: 'Jun', usage: 2390 },
  ];

  const serviceDistributionData = [
    { name: 'Service A', value: 400 },
    { name: 'Service B', value: 300 },
    { name: 'Service C', value: 300 },
    { name: 'Service D', value: 200 },
  ];

  const progressData = [
    { name: 'Uptime', value: 92 },
    { name: 'Performance', value: 87 },
    { name: 'Reliability', value: 95 },
    { name: 'Customer Satisfaction', value: 88 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* <h1 className="text-3xl font-bold mb-8 text-gray-800">My Services Dashboard</h1> */}
      
      {/* Progress Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Service Health Metrics</h2>
        <div className="space-y-4">
          {progressData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-gray-600">{item.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Monthly Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usage" name="API Calls" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Service Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDistributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {serviceDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ServicesApp;