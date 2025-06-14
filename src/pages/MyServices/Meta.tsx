
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ServicesMeta = () => {
  // Mock data for charts
  const serviceData = [
    { name: 'Service A', usage: 400, uptime: 90, cost: 210 },
    { name: 'Service B', usage: 300, uptime: 85, cost: 180 },
    { name: 'Service C', usage: 200, uptime: 95, cost: 150 },
    { name: 'Service D', usage: 278, uptime: 78, cost: 200 },
    { name: 'Service E', usage: 189, uptime: 92, cost: 170 },
  ];

  const performanceData = [
    { month: 'Jan', response: 400, latency: 200 },
    { month: 'Feb', response: 300, latency: 180 },
    { month: 'Mar', response: 200, latency: 150 },
    { month: 'Apr', response: 278, latency: 220 },
    { month: 'May', response: 189, latency: 190 },
    { month: 'Jun', response: 239, latency: 160 },
  ];

  const resourceData = [
    { name: 'Compute', value: 45 },
    { name: 'Storage', value: 30 },
    { name: 'Network', value: 15 },
    { name: 'Database', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Progress data
  const progressMetrics = [
    { name: 'Deployment', value: 85 },
    { name: 'Integration', value: 60 },
    { name: 'Migration', value: 90 },
    { name: 'Optimization', value: 75 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* <h1 className="text-3xl font-bold text-gray-800 mb-8">My Services - Meta Dashboard</h1> */}
      
      {/* Progress Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Progress Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {progressMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg font-medium text-gray-700">{metric.name}</span>
                <span className="text-xl font-bold text-blue-600">{metric.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="space-y-8">
        {/* Service Usage Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Usage Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usage" fill="#8884d8" name="Usage (hours)" />
              <Bar dataKey="cost" fill="#82ca9d" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Performance Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="response" 
                stroke="#8884d8" 
                name="Response Time (ms)" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="latency" 
                stroke="#82ca9d" 
                name="Latency (ms)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Resource Allocation</h2>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Allocation']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesMeta;