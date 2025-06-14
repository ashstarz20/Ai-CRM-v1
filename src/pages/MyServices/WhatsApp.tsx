import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const ServicesWhatsApp = () => {
  // Mock data for analytics
  const messageData = [
    { name: 'Jan', sent: 4000, received: 2400 },
    { name: 'Feb', sent: 3000, received: 1398 },
    { name: 'Mar', sent: 2000, received: 9800 },
    { name: 'Apr', sent: 2780, received: 3908 },
    { name: 'May', sent: 1890, received: 4800 },
    { name: 'Jun', sent: 2390, received: 3800 },
  ];

  const statusData = [
    { name: 'Delivered', value: 75 },
    { name: 'Read', value: 60 },
    { name: 'Failed', value: 5 },
    { name: 'Pending', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Progress data
  const progressMetrics = [
    { name: 'Service Usage', value: 75 },
    { name: 'Response Rate', value: 90 },
    { name: 'Customer Satisfaction', value: 82 },
    { name: 'Automation Rate', value: 68 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Service Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Monitor your WhatsApp service performance and metrics
        </p>
      </div> */}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Message Volume Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Message Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={messageData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="#4CAF50" name="Messages Sent" />
              <Bar dataKey="received" fill="#3B82F6" name="Messages Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Message Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Message Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Service Metrics</h2>
        <div className="space-y-6">
          {progressMetrics.map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-gray-700">{metric.name}</span>
                <span className="text-sm font-medium text-gray-700">{metric.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${metric.value}%`,
                    backgroundColor: metric.value > 75 
                      ? '#10B981' 
                      : metric.value > 50 
                        ? '#F59E0B' 
                        : '#EF4444'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Messages', value: '24,560', change: '+12.4%' },
          { title: 'Avg Response Time', value: '42s', change: '-3.2s' },
          { title: 'Active Contacts', value: '1,842', change: '+5.3%' },
          { title: 'Satisfaction Rate', value: '94%', change: '+2.1%' },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-green-500 text-sm mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Optimization Tips</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>Response rate above 90% - Excellent performance!</li>
          <li>Try adding more automated responses to improve response time</li>
          <li>Customer satisfaction increased by 5% this month</li>
        </ul>
      </div>
    </div>
  );
};

export default ServicesWhatsApp;