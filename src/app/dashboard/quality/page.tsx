'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Search,
  RefreshCw,
  Star
} from 'lucide-react';
import DebugInfo from '@/components/DebugInfo';

interface Transcription {
  id: string;
  user_id: string;
  file_name: string;
  transcript_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  text?: string;
  duration: number;
  file_size?: number;
  file_type?: string;
  transcription_text: string;
  quality_score?: number;
  reviewed: boolean;
  reviewed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

interface QualityMetrics {
  total_transcriptions: number;
  reviewed_transcriptions: number;
  average_quality_score: number;
  pending_reviews: number;
}

export default function QualityControlPage() {
  const [loading, setLoading] = useState(true);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics>({
    total_transcriptions: 0,
    reviewed_transcriptions: 0,
    average_quality_score: 0,
    pending_reviews: 0
  });
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    fetchTranscriptions();
  }, [statusFilter, reviewFilter]);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let query = supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (reviewFilter !== 'all') {
        query = query.eq('reviewed', reviewFilter === 'reviewed');
      }

      const { data, error } = await query;

      if (error) throw error;

      setTranscriptions(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: Transcription[]) => {
    const total = data.length;
    const reviewed = data.filter(t => t.reviewed).length;
    const qualityScores = data
      .filter(t => t.quality_score !== undefined)
      .map(t => t.quality_score || 0);
    const avgScore = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0;

    setMetrics({
      total_transcriptions: total,
      reviewed_transcriptions: reviewed,
      average_quality_score: avgScore,
      pending_reviews: total - reviewed
    });
  };

  const handleReview = async (transcription: Transcription, qualityScore: number) => {
    if (!transcription || !transcription.id) {
      console.error('Invalid transcription data');
      return;
    }

    try {
      // Prepare update data with proper types
      const updateData: {
        reviewed: boolean;
        quality_score: number;
        reviewed_at?: string;
      } = {
        reviewed: true,
        quality_score: qualityScore,
        reviewed_at: new Date().toISOString(),
      };

      // Update the transcription in database
      const { error } = await supabase
        .from('transcriptions')
        .update(updateData)
        .eq('id', transcription.id);

      if (error) {
        console.error('Supabase update error:', error);
        return;
      }

      // Update local state only after successful database update
      const updatedTranscriptions = transcriptions.map(t => 
        t.id === transcription.id 
          ? { ...t, reviewed: true, quality_score: qualityScore }
          : t
      );
      setTranscriptions(updatedTranscriptions);
      calculateMetrics(updatedTranscriptions);
      setSelectedTranscription(null);
    } catch (error) {
      console.error('Error updating transcription:', error);
      // Don't rethrow to prevent unhandled promise rejections
    }
  };

  const filteredTranscriptions = transcriptions.filter(t => 
    t.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number): string => {
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
      {/* Quality Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transcriptions</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.total_transcriptions}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Reviewed</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.reviewed_transcriptions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Quality Score</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.average_quality_score.toFixed(1)}/5
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
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.pending_reviews}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="reviewed">Reviewed</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={fetchTranscriptions}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Transcriptions List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTranscriptions.map((transcription) => (
                <tr key={transcription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transcription.file_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transcription.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : transcription.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transcription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(transcription.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transcription.quality_score !== undefined ? (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (transcription.quality_score || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not rated</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transcription.reviewed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedTranscription(transcription)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedTranscription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Transcription: {selectedTranscription.file_name}
                </h3>
                <button
                  onClick={() => setSelectedTranscription(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>
              
              {/* Debug Information */}
              <DebugInfo data={selectedTranscription} title="Transcription Data" />
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Transcription Text</h4>
                <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedTranscription.transcription_text}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quality Rating</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReview(selectedTranscription, score);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-md"
                      type="button"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          score <= (selectedTranscription?.quality_score || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {selectedTranscription.error_message && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Error Message</h4>
                  <p className="text-sm text-red-600">{selectedTranscription.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 