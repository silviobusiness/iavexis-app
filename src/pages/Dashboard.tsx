import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase, 
  AlertCircle, 
  ArrowUpRight,
  Zap,
  Star,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 8000 },
];

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-surface-1 border border-white/5 p-6 rounded-xl hover:border-white/10 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-lg bg-white/5", color)}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-neon text-sm font-medium">
          <ArrowUpRight className="w-4 h-4" />
          {trend}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
    </div>
  </motion.div>
);

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-white">COMMAND CENTER</h1>
          <p className="text-gray-400 font-medium">Welcome back, Designer. Your ecosystem is optimized.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History
          </button>
          <button className="px-4 py-2 bg-green-neon text-black rounded-lg text-sm font-bold hover:bg-green-neon/90 transition-all flex items-center gap-2">
            <Zap className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      {/* Smart Alerts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-neon/10 border border-purple-neon/20 p-4 rounded-xl flex items-center gap-4">
          <div className="p-2 bg-purple-neon/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-neon" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Content Gap Detected</p>
            <p className="text-xs text-purple-neon/80">You haven't posted a reel in 3 days. Engagement is dropping.</p>
          </div>
        </div>
        <div className="bg-green-neon/10 border border-green-neon/20 p-4 rounded-xl flex items-center gap-4">
          <div className="p-2 bg-green-neon/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-neon" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Stalled Lead</p>
            <p className="text-xs text-green-neon/80">"Nike Concept" proposal hasn't been opened. Follow up now.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">New Trend Alert</p>
            <p className="text-xs text-gray-400">"Retro Brutalism" is peaking in sports design. Explore assets.</p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value="R$ 12.450,00" trend="+12%" icon={DollarSign} color="text-green-neon" />
        <StatCard label="Active Projects" value="8" trend="+2" icon={Briefcase} color="text-white" />
        <StatCard label="Leads in Pipeline" value="24" trend="+5" icon={Users} color="text-purple-neon" />
        <StatCard label="Growth Score" value="88/100" trend="+4%" icon={TrendingUp} color="text-purple-neon" />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-surface-1 border border-white/5 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold tracking-tight text-white">Revenue Growth</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none focus:border-green-neon transition-all">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#39FF14' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#39FF14" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next Recommended Actions */}
        <div className="bg-surface-1 border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-white">Recommended Actions</h3>
          <div className="space-y-4">
            {[
              { id: 1, text: 'Send proposal to "Red Bull Gaming"', type: 'sales', icon: Zap },
              { id: 2, text: 'Create content from "Jersey Concept"', type: 'growth', icon: TrendingUp },
              { id: 3, text: 'Clean up "Assets" folder', type: 'management', icon: Briefcase },
              { id: 4, text: 'Analyze "Nike" post performance', type: 'growth', icon: TrendingUp },
            ].map((action) => (
              <button
                key={action.id}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-green-neon/10 transition-all">
                  <action.icon className="w-5 h-5 text-gray-400 group-hover:text-green-neon transition-all" />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-all">{action.text}</span>
              </button>
            ))}
          </div>
          <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            View All Actions
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight text-white">Recent Projects</h3>
          <button className="text-green-neon text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 1, title: 'Nike Concept 2024', status: 'In Progress', progress: 65, image: 'https://picsum.photos/seed/sports1/400/300' },
            { id: 2, title: 'Red Bull Branding', status: 'Completed', progress: 100, image: 'https://picsum.photos/seed/sports2/400/300' },
            { id: 3, title: 'F1 Poster Series', status: 'In Progress', progress: 30, image: 'https://picsum.photos/seed/sports3/400/300' },
            { id: 4, title: 'NBA Social Kit', status: 'Review', progress: 90, image: 'https://picsum.photos/seed/sports4/400/300' },
          ].map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -5 }}
              className="bg-surface-1 border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  {project.status}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h4 className="font-bold text-white truncate">{project.title}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className="h-full bg-green-neon"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
