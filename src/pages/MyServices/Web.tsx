
import { 
  BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';

const Web = () => {
  // Sample analytics data
  const trafficData = [
    { date: 'Jan', visitors: 4000, pageViews: 2400 },
    { date: 'Feb', visitors: 3000, pageViews: 1398 },
    { date: 'Mar', visitors: 5000, pageViews: 2800 },
    { date: 'Apr', visitors: 2780, pageViews: 3908 },
    { date: 'May', visitors: 1890, pageViews: 4800 },
    { date: 'Jun', visitors: 2390, pageViews: 3800 },
  ];

  const resourceUsage = [
    { name: 'Storage', usage: 75, fill: '#8884d8' },
    { name: 'Bandwidth', usage: 60, fill: '#83a6ed' },
    { name: 'Memory', usage: 45, fill: '#8dd1e1' },
  ];

  const serviceStatus = [
    { name: 'Uptime', value: 99.7, fill: '#00C49F' },
    { name: 'Response', value: 95.2, fill: '#FFBB28' },
    { name: 'Load', value: 87.4, fill: '#FF8042' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* <h1 className="text-3xl font-bold text-gray-800 mb-8">My Services - Web Dashboard</h1> */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Traffic Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Monthly Traffic Analytics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitors" fill="#4f46e5" name="Unique Visitors" />
              <Bar dataKey="pageViews" fill="#22d3ee" name="Page Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Usage */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Resource Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="visitors" 
                fill="#8884d8" 
                stroke="#8884d8" 
                name="Bandwidth (GB)" 
              />
              <Area 
                type="monotone" 
                dataKey="pageViews" 
                fill="#82ca9d" 
                stroke="#82ca9d" 
                name="Storage (TB)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Service Uptime */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Health</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart 
              innerRadius="20%" 
              outerRadius="100%" 
              barSize={16} 
              data={serviceStatus}
              startAngle={180} 
              endAngle={0}
            >
              <RadialBar
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                dataKey="value"
              />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Indicators */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Progress</h2>
          <div className="space-y-6">
            {resourceUsage.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium">{item.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${item.usage}%`,
                      backgroundColor: item.fill
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="bg-indigo-700 p-4 rounded-lg">
              <p className="text-sm opacity-80">Avg. Response Time</p>
              <p className="text-2xl font-bold">142ms</p>
            </div>
            <div className="bg-indigo-700 p-4 rounded-lg">
              <p className="text-sm opacity-80">Error Rate</p>
              <p className="text-2xl font-bold">0.2%</p>
            </div>
            <div className="bg-indigo-700 p-4 rounded-lg">
              <p className="text-sm opacity-80">Satisfaction Score</p>
              <p className="text-2xl font-bold">4.8/5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Web;