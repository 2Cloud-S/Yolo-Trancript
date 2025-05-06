'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface TranscriptionStats {
  total_transcriptions: number;
  completed_transcriptions: number;
  failed_transcriptions: number;
  average_duration: number;
  total_duration: number;
}

interface DailyStats {
  date: string;
  transcriptions: number;
  duration: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TranscriptionStats>({
    total_transcriptions: 0,
    completed_transcriptions: 0,
    failed_transcriptions: 0,
    average_duration: 0,
    total_duration: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get analytics data from the view
      const { data: analytics, error: analyticsError } = await supabase
        .from('transcription_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', getDateFromRange(timeRange))
        .order('date', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Calculate total stats
      const totalStats = calculateTotalStats(analytics);
      setStats(totalStats);

      // Format daily stats for charts
      const formattedDailyStats = formatDailyStats(analytics);
      setDailyStats(formattedDailyStats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStats = (analytics: any[]): TranscriptionStats => {
    if (!analytics || analytics.length === 0) {
      return {
        total_transcriptions: 0,
        completed_transcriptions: 0,
        failed_transcriptions: 0,
        total_duration: 0,
        average_duration: 0
      };
    }
    
    const stats = analytics.reduce((acc, day) => {
      // Safely add values to avoid NaN results
      const safeAdd = (a: number, b: number | null | undefined) => {
        const valueB = typeof b === 'number' && !Number.isNaN(b) ? b : 0;
        return a + valueB;
      };
      
      return {
        total_transcriptions: safeAdd(acc.total_transcriptions, day.total_transcriptions),
        completed_transcriptions: safeAdd(acc.completed_transcriptions, day.completed_transcriptions),
        failed_transcriptions: safeAdd(acc.failed_transcriptions, day.failed_transcriptions),
        total_duration: safeAdd(acc.total_duration, day.total_duration || 0),
        // Keep using the last non-zero average or default to 0
        average_duration: (day.average_duration && !Number.isNaN(day.average_duration)) 
          ? day.average_duration 
          : acc.average_duration
      };
    }, {
      total_transcriptions: 0,
      completed_transcriptions: 0,
      failed_transcriptions: 0,
      total_duration: 0,
      average_duration: 0
    });
    
    // Calculate the final average if we have a valid total_duration
    if (stats.total_transcriptions > 0 && stats.total_duration > 0) {
      stats.average_duration = stats.total_duration / stats.total_transcriptions;
    }
    
    return stats;
  };

  const formatDailyStats = (analytics: any[]): DailyStats[] => {
    if (!analytics || analytics.length === 0) {
      return [];
    }
    
    return analytics.map(day => {
      // Ensure all values are valid numbers, not NaN
      const transcriptions = typeof day.total_transcriptions === 'number' && !Number.isNaN(day.total_transcriptions)
        ? day.total_transcriptions 
        : 0;
        
      const duration = typeof day.total_duration === 'number' && !Number.isNaN(day.total_duration)
        ? day.total_duration
        : 0;
        
      return {
        date: new Date(day.date).toISOString().split('T')[0],
        transcriptions,
        duration
      };
    });
  };

  const getDateFromRange = (range: string): string => {
    const date = new Date();
    switch (range) {
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      default: // 7d
        date.setDate(date.getDate() - 7);
    }
    return date.toISOString();
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    // Handle null, undefined, NaN, or negative values
    if (seconds == null || Number.isNaN(seconds) || seconds < 0) {
      return "0 min";
    }
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Time Range Selector */}
      <div className="mb-6 flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transcriptions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Number.isNaN(stats.total_transcriptions) ? '0' : stats.total_transcriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Number.isNaN(stats.completed_transcriptions) ? '0' : stats.completed_transcriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Number.isNaN(stats.failed_transcriptions) ? '0' : stats.failed_transcriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Duration</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatDuration(Number.isNaN(stats.average_duration) ? null : stats.average_duration)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Transcriptions Over Time */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transcriptions Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date: string) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date: string) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [value, 'Transcriptions']}
                />
                <Line 
                  type="monotone" 
                  dataKey="transcriptions" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Over Time */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Duration Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date: string) => new Date(date).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value: number) => formatDuration(value)}
                />
                <Tooltip 
                  labelFormatter={(date: string) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [formatDuration(value), 'Duration']}
                />
                <Bar 
                  dataKey="duration" 
                  fill="#3B82F6" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Credit System Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Credit System</h3>
        <div className="text-sm text-gray-600 mb-4">
          <p>Our credit system charges based on audio duration:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>1 credit</strong> = 6 minutes of transcription</li>
            <li>Minimum 1 credit per transcription</li>
            <li>Credits are calculated based on the exact duration of your audio/video</li>
          </ul>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-medium">Examples:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>A 4-minute audio file uses 1 credit</li>
            <li>A 10-minute video uses 2 credits</li>
            <li>A 30-minute podcast uses 5 credits</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 