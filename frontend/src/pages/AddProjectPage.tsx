// src/pages/AddProjectPage.tsx
// Add new project form with AI analysis trigger

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, DollarSign, Calendar, Upload, Brain,
  AlertCircle, X, Info, Sparkles,
} from 'lucide-react';
import { projectService } from '@/services/projectService';
import DashboardLayout from '@/layouts/DashboardLayout';
import type { AnalyzeProjectRequest } from '@/types/project';

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 10000;

const AddProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AnalyzeProjectRequest>({
    title: '',
    description: '',
    budget: undefined,
    deadline: undefined,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const descriptionLength = formData.description.length;
  const isDescriptionValid = descriptionLength >= MIN_DESCRIPTION_LENGTH;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setError(null);
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDescriptionValid) {
      setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Navigate to analyzing page immediately with the form data
    navigate('/dashboard/analyzing', {
      state: {
        projectData: {
          ...formData,
          deadline: formData.deadline || undefined,
          budget: formData.budget || undefined,
        },
      },
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
            <Brain size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Add New Project</h1>
            <p className="text-gray-400 text-sm">Describe your project for AI-powered analysis</p>
          </div>
        </div>
      </div>

      {/* AI Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 mb-6">
        <Sparkles size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">Requirement Intelligence Agent</p>
          <p className="text-gray-400 text-sm mt-0.5">
            After you click <strong className="text-white">Analyze Project</strong>, our AI agent will extract technologies,
            skills, features, complexity, timeline, budget estimates and risks from your description.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAnalyze} className="space-y-6">
        <div className="glass-card p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="input-label">
              Project Title <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="E.g., AI-powered E-commerce Platform with Recommendation Engine"
                className="input-field pl-11"
                required
                minLength={3}
                maxLength={500}
              />
            </div>
          </div>

          {/* Project Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="description" className="input-label mb-0">
                Project Description <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${
                descriptionLength < MIN_DESCRIPTION_LENGTH
                  ? 'text-gray-500'
                  : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                  ? 'text-yellow-400'
                  : 'text-emerald-400'
              }`}>
                {descriptionLength} / {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={`Describe your project in detail. Include:
• What problem you're solving
• Target users / audience
• Core features you need
• Preferred technologies (if any)
• Integrations required (payment, APIs, etc.)
• Any specific requirements or constraints

More detail = better AI analysis.`}
              className="input-field resize-none h-48 py-4 leading-relaxed"
              required
              minLength={MIN_DESCRIPTION_LENGTH}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />

            {/* Description progress bar */}
            <div className="mt-2 h-1 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDescriptionValid ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min((descriptionLength / MIN_DESCRIPTION_LENGTH) * 100, 100)}%`,
                }}
              />
            </div>
            {!isDescriptionValid && descriptionLength > 0 && (
              <p className="text-gray-500 text-xs mt-1">
                {MIN_DESCRIPTION_LENGTH - descriptionLength} more characters needed
              </p>
            )}
          </div>

          {/* Budget + Deadline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget */}
            <div>
              <label htmlFor="budget" className="input-label">
                Budget (₹ INR) <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={handleChange}
                  placeholder="50000"
                  className="input-field pl-11"
                  min={0}
                  step={500}
                />
              </div>
              <p className="text-gray-600 text-xs mt-1.5 flex items-center gap-1">
                <Info size={10} />
                AI will suggest realistic budget if not specified
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="input-label">
                Deadline <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline as string || ''}
                  onChange={handleChange}
                  className="input-field pl-11"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-gray-600 text-xs mt-1.5 flex items-center gap-1">
                <Info size={10} />
                AI will estimate realistic timeline if not specified
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="input-label">
              Supporting Document <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                uploadedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setUploadedFile(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md"
              />

              {uploadedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <Upload size={18} className="text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-medium">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={24} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    Drop file here or <span className="text-blue-400">browse</span>
                  </p>
                  <p className="text-gray-600 text-xs mt-1">PDF, DOC, DOCX, TXT, MD — max 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!formData.title || !isDescriptionValid || isAnalyzing}
          className="btn-primary w-full text-base py-4 flex items-center justify-center gap-3"
        >
          <Brain size={20} />
          <span>Analyze Project with AI</span>
          <Sparkles size={16} />
        </button>

        <p className="text-center text-gray-600 text-xs">
          Analysis typically takes 15–30 seconds depending on description complexity
        </p>
      </form>
    </DashboardLayout>
  );
};

export default AddProjectPage;
