'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  File, 
  Image, 
  FileText, 
  Film, 
  Music, 
  Archive, 
  Download, 
  Trash2, 
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye
} from 'lucide-react';
import FileUpload from '@/components/documents/file-upload';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
  createdAt: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents/${doc.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type.includes(filterType);
    return matchesSearch && matchesType;
  });

  const fileTypes = [
    { value: 'all', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Documents</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage all your uploaded files and documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="mb-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <FileUpload 
            onUploadComplete={() => {
              setShowUpload(false);
              fetchDocuments();
            }} 
          />
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
        >
          {fileTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {searchQuery ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {searchQuery 
              ? 'Try a different search term'
              : 'Upload your first document to get started'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            const isImage = doc.type.startsWith('image/');

            return (
              <div
                key={doc.id}
                className="group bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview Area */}
                <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${doc.url}`}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="w-12 h-12 text-neutral-400" />
                  )}
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-neutral-700" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-medium text-neutral-900 dark:text-white truncate text-sm" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-500">{formatFileSize(doc.size)}</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {(doc.customer || doc.deal) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.customer && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {doc.customer.name}
                        </span>
                      )}
                      {doc.deal && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {doc.deal.title}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-wrap gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{documents.length} total files</span>
            <span>
              {formatFileSize(documents.reduce((acc, doc) => acc + doc.size, 0))} total size
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
