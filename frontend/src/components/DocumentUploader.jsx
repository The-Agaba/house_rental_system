import { useState } from 'react';
import { Upload, FileText, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DocumentUploader = ({ requestId, properties = [], onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('OWNERSHIP'); // 'OWNERSHIP', 'TIN', 'OTHER'
  const [requestPropertyId, setRequestPropertyId] = useState(properties[0]?.id || '');
  const [uploading, setUploading] = useState(false);
  const fileInputId = `verification-doc-${requestId}`;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload first.');
      return;
    }
    if (docType === 'OWNERSHIP' && properties.length > 0 && !requestPropertyId) {
      toast.error('Choose the property this ownership document belongs to.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);
    if (docType === 'OWNERSHIP' && requestPropertyId) {
      formData.append('requestPropertyId', requestPropertyId);
    }

    try {
      const res = await axios.post(`/landlord-requests/${requestId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(`${docType} document uploaded successfully!`);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Document Type Selector */}
        <div className="flex-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-2 ml-1">Document Type</label>
          <div className="grid grid-cols-3 gap-2">
            {['OWNERSHIP', 'TIN', 'OTHER'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDocType(type)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  docType === type
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-750'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* File selector input */}
        <div className="flex-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-2 ml-1">Select File</label>
          <div className="relative">
            <input
              type="file"
              required
              id={fileInputId}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
            <label
              htmlFor={fileInputId}
              className="flex items-center gap-2 w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
            >
              <Upload size={16} className="text-slate-400" />
              <span className="truncate max-w-[180px]">
                {file ? file.name : 'Choose File...'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {docType === 'OWNERSHIP' && properties.length > 0 && (
        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-2 ml-1">Property This Document Verifies</label>
          <select
            className="input-field text-sm"
            value={requestPropertyId}
            onChange={(e) => setRequestPropertyId(e.target.value)}
            required
          >
            <option value="">Select claimed property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title} - {property.location}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploading || !file}
        className="btn-primary w-full !py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Uploading Document...
          </>
        ) : (
          <>
            <FileText size={16} /> Upload Document Verification
          </>
        )}
      </button>
    </form>
  );
};

export default DocumentUploader;
