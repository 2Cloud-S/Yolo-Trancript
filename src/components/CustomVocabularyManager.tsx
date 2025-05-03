'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, Edit2, Check, Trash2, AlertCircle, Download, Upload, Copy } from 'lucide-react';
import { 
  getCustomVocabularies, 
  createCustomVocabulary, 
  updateCustomVocabulary, 
  deleteCustomVocabulary 
} from '@/lib/supabase';
import { CustomVocabulary } from '@/types/transcription';

interface CustomVocabularyManagerProps {
  userId: string;
  onSelect?: (vocabulary: CustomVocabulary) => void;
  onClose?: () => void;
  selectedId?: string;
}

export default function CustomVocabularyManager({ 
  userId, 
  onSelect, 
  onClose,
  selectedId 
}: CustomVocabularyManagerProps) {
  const [vocabularies, setVocabularies] = useState<CustomVocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);
  
  // Form fields
  const [newVocabName, setNewVocabName] = useState('');
  const [newVocabTerms, setNewVocabTerms] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Import/export
  const [showImportForm, setShowImportForm] = useState(false);
  const [importText, setImportText] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportVocabularyId, setExportVocabularyId] = useState<string | null>(null);
  const [exportCode, setExportCode] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  
  // Load vocabularies
  useEffect(() => {
    loadVocabularies();
  }, [userId]);
  
  const loadVocabularies = async () => {
    try {
      setLoading(true);
      setError(null);
      const vocabs = await getCustomVocabularies(userId);
      setVocabularies(vocabs);
    } catch (err: any) {
      console.error('Error loading vocabularies:', err);
      setError(err.message || 'Failed to load custom vocabularies');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddVocabulary = async () => {
    try {
      setError(null);
      const terms = newVocabTerms.split(',').map(term => term.trim()).filter(term => term);
      
      if (!newVocabName) {
        setError('Please provide a name for your vocabulary set');
        return;
      }
      
      if (terms.length === 0) {
        setError('Please add at least one term to your vocabulary');
        return;
      }
      
      const newVocab = await createCustomVocabulary(userId, newVocabName, terms, isDefault);
      setVocabularies([...vocabularies, newVocab]);
      resetForm();
    } catch (err: any) {
      console.error('Error adding vocabulary:', err);
      setError(err.message || 'Failed to add custom vocabulary');
    }
  };
  
  const handleUpdateVocabulary = async (id: string) => {
    try {
      setError(null);
      const terms = newVocabTerms.split(',').map(term => term.trim()).filter(term => term);
      
      if (!newVocabName) {
        setError('Please provide a name for your vocabulary set');
        return;
      }
      
      if (terms.length === 0) {
        setError('Please add at least one term to your vocabulary');
        return;
      }
      
      const updatedVocab = await updateCustomVocabulary(id, {
        name: newVocabName,
        terms,
        is_default: isDefault
      });
      
      setVocabularies(vocabularies.map(v => v.id === id ? updatedVocab : v));
      resetForm();
    } catch (err: any) {
      console.error('Error updating vocabulary:', err);
      setError(err.message || 'Failed to update custom vocabulary');
    }
  };
  
  const handleDeleteVocabulary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary set?')) return;
    
    try {
      setError(null);
      await deleteCustomVocabulary(id);
      setVocabularies(vocabularies.filter(v => v.id !== id));
    } catch (err: any) {
      console.error('Error deleting vocabulary:', err);
      setError(err.message || 'Failed to delete custom vocabulary');
    }
  };
  
  const handleEdit = (vocab: CustomVocabulary) => {
    setNewVocabName(vocab.name);
    setNewVocabTerms(vocab.terms.join(', '));
    setIsDefault(vocab.is_default);
    setEditingVocabId(vocab.id);
    setShowAddForm(true);
  };
  
  const resetForm = () => {
    setNewVocabName('');
    setNewVocabTerms('');
    setIsDefault(false);
    setShowAddForm(false);
    setEditingVocabId(null);
  };
  
  const handleShowExport = (vocabId: string) => {
    const vocab = vocabularies.find(v => v.id === vocabId);
    if (!vocab) return;
    
    const exportData = {
      name: vocab.name,
      terms: vocab.terms,
      is_default: vocab.is_default
    };
    
    // Create a simple export code (in production, you'd want a more secure encoding method)
    const code = Buffer.from(JSON.stringify(exportData)).toString('base64');
    setExportCode(code);
    setExportVocabularyId(vocabId);
    setShowExportModal(true);
  };
  
  const handleImportVocabulary = () => {
    try {
      setError(null);
      if (!importText.trim()) {
        setError('Please enter an import code');
        return;
      }
      
      // Decode the import code
      const decodedData = JSON.parse(Buffer.from(importText, 'base64').toString());
      
      // Validate the data
      if (!decodedData.name || !Array.isArray(decodedData.terms) || decodedData.terms.length === 0) {
        setError('Invalid import code format');
        return;
      }
      
      // Set the form with the imported data
      setNewVocabName(decodedData.name);
      setNewVocabTerms(decodedData.terms.join(', '));
      setIsDefault(decodedData.is_default || false);
      
      // Close import form and open the add form to let user review
      setShowImportForm(false);
      setShowAddForm(true);
    } catch (err) {
      console.error('Error importing vocabulary:', err);
      setError('Could not parse import code. Please check and try again.');
    }
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  if (loading && vocabularies.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Custom Vocabulary</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {!showAddForm && !showImportForm ? (
        <div className="mb-6 flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Vocabulary Set
          </button>
          <button
            onClick={() => setShowImportForm(true)}
            className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-5 w-5 mr-2" />
            Import Vocabulary
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {editingVocabId ? 'Edit Vocabulary Set' : 'Add New Vocabulary Set'}
          </h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="vocab-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="vocab-name"
                type="text"
                value={newVocabName}
                onChange={(e) => setNewVocabName(e.target.value)}
                placeholder="e.g., Medical Terms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="vocab-terms" className="block text-sm font-medium text-gray-700 mb-1">
                Terms (comma separated)
              </label>
              <textarea
                id="vocab-terms"
                value={newVocabTerms}
                onChange={(e) => setNewVocabTerms(e.target.value)}
                placeholder="e.g., hypertension, myocardial infarction, tachycardia"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add specialized terms, names, or technical jargon to improve transcription accuracy
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                id="is-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is-default" className="ml-2 block text-sm text-gray-700">
                Set as default vocabulary (applied to all new transcriptions)
              </label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => editingVocabId ? handleUpdateVocabulary(editingVocabId) : handleAddVocabulary()}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingVocabId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showImportForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Import Vocabulary Set
          </h4>
          <div className="space-y-4">
            <div>
              <label htmlFor="import-code" className="block text-sm font-medium text-gray-700 mb-1">
                Import Code
              </label>
              <textarea
                id="import-code"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste the vocabulary import code here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Paste a vocabulary code shared by another user
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowImportForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleImportVocabulary}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Export Vocabulary</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Copy this code to share your vocabulary with others. They can import it from the "Import Vocabulary" button.
            </p>
            
            <div className="relative">
              <textarea
                readOnly
                value={exportCode}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 p-1 bg-white rounded border border-gray-200 hover:bg-gray-50"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            {exportCopied && (
              <p className="mt-2 text-sm text-green-600">Copied to clipboard!</p>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {vocabularies.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No custom vocabularies yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vocabularies.map(vocab => (
            <div 
              key={vocab.id}
              className={`p-4 border rounded-lg ${
                selectedId === vocab.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900">{vocab.name}</h4>
                    {vocab.is_default && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {vocab.terms.length} terms
                  </p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {vocab.terms.slice(0, 5).join(", ")}
                      {vocab.terms.length > 5 ? `, +${vocab.terms.length - 5} more` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {onSelect && (
                    <button
                      onClick={() => onSelect(vocab)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Select this vocabulary"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(vocab)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Edit vocabulary"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleShowExport(vocab.id)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Export vocabulary"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteVocabulary(vocab.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete vocabulary"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 