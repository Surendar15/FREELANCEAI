// src/components/progress/FreelancerProgressTracker.tsx
// Agent 6 — Progress Monitoring & Delivery Freelancer Component

import React, { useState } from 'react';
import {
  CheckCircle2, Clock, Upload, GitBranch, FileText, ExternalLink,
  Loader2, AlertTriangle, Play, Sparkles, Check, Send, Award, X, Download
} from 'lucide-react';
import { useProjectProgress } from '@/hooks/useProjectProgress';
import type { ProgressTask } from '@/types/progress';

interface FreelancerProgressTrackerProps {
  projectId: string;
}

export const FreelancerProgressTracker: React.FC<FreelancerProgressTrackerProps> = ({ projectId }) => {
  const {
    overview,
    isLoading,
    isUpdating,
    error,
    uploadProgress,
    markTaskComplete,
    submitFinalProject,
  } = useProjectProgress(projectId);

  // Modal States
  const [uploadTaskModal, setUploadTaskModal] = useState<ProgressTask | null>(null);
  const [commitUrl, setCommitUrl] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [filePath, setFilePath] = useState('');

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [finalGithubUrl, setFinalGithubUrl] = useState('');
  const [finalZipPath, setFinalZipPath] = useState('');
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [finalDeployUrl, setFinalDeployUrl] = useState('');
  const [finalDocPath, setFinalDocPath] = useState('');

  const handleZipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedZipFile(file);
      setFinalZipPath(file.name);
    }
  };

  const handleRemoveZipFile = () => {
    setSelectedZipFile(null);
    setFinalZipPath('');
  };

  if (!isLoading && !overview) {
    return null;
  }

  if (isLoading) {
    return <div className="skeleton h-72 rounded-2xl mt-8" />;
  }

  if (!overview || (overview.tasks && overview.tasks.length === 0)) return null;

  const tasks = overview.tasks || [];
  const sub = overview.submission;
  const isAllTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === 'COMPLETED');

  const handleUploadSubmit = async () => {
    if (!uploadTaskModal) return;
    const success = await uploadProgress({
      task_id: uploadTaskModal.id,
      description: proofDesc,
      github_commit_url: commitUrl,
      file_path: filePath,
    });
    if (success) {
      setUploadTaskModal(null);
      setCommitUrl('');
      setProofDesc('');
      setFilePath('');
    }
  };

  const handleFinalSubmit = async () => {
    const zipName = selectedZipFile ? selectedZipFile.name : finalZipPath;
    if (!zipName) {
      alert('Please upload or select a Project Code ZIP file.');
      return;
    }
    const success = await submitFinalProject({
      github_url: finalGithubUrl,
      zip_file_path: zipName,
      deployment_url: finalDeployUrl,
      documentation_path: finalDocPath,
    });
    if (success) {
      setShowSubmitModal(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-white">⚡ Milestone Progress Tracking</h3>
            <span className="badge-purple text-xs font-semibold px-2.5 py-0.5">Agent 6 Active</span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">
            Update your task deliverables, commit proofs, and complete milestones on schedule.
          </p>
        </div>

        {/* Submit Final Project Button */}
        {!sub ? (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Send size={16} />
            <span>Submit Final Project Deliverables</span>
          </button>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>🎉 Project Submitted & Completed ✓</span>
          </div>
        )}
      </div>

      {/* 🎉 PROJECT COMPLETED & DELIVERED BANNER ON FREELANCER SIDE */}
      {sub && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-teal-950/70 to-dark-950 border-2 border-emerald-500/50 shadow-2xl mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg">
                <Award size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-green text-xs font-extrabold px-3 py-1">
                    {sub.approved_at ? 'PROJECT COMPLETED & APPROVED ✓' : 'PROJECT SUBMITTED & COMPLETED ✓'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Project Deliverables Submitted & Completed</h3>
                <p className="text-emerald-300 text-xs mt-1">
                  {sub.approved_at
                    ? 'The client has approved your final project submission.'
                    : 'Your final project files have been delivered to the client for final review.'}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-300 mt-4">
                  {sub.zip_file_path && (() => {
                    const zipPath = sub.zip_file_path;
                    return (
                      <a
                        href={
                          zipPath.startsWith('http') || zipPath.startsWith('blob:')
                            ? zipPath
                            : '#'
                        }
                        onClick={(e) => {
                          if (!zipPath.startsWith('http') && !zipPath.startsWith('blob:')) {
                            e.preventDefault();
                            const element = document.createElement('a');
                            const file = new Blob([`AgentVerse Project Deliverable Archive: ${zipPath}\nProject Source Code & Deliverables.`], { type: 'application/zip' });
                            element.href = URL.createObjectURL(file);
                            element.download = zipPath.endsWith('.zip') ? zipPath : `${zipPath}.zip`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }
                        }}
                        className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                        title="Download ZIP Archive"
                      >
                        <Download size={14} className="text-emerald-400" />
                        Code Archive ZIP: <strong>{zipPath}</strong>
                        <ExternalLink size={12} className="text-emerald-400" />
                      </a>
                    );
                  })()}
                  {sub.github_url && (
                    <a href={sub.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-purple-300 hover:text-white transition-colors">
                      <GitBranch size={14} className="text-purple-400" />
                      Repository <ExternalLink size={12} />
                    </a>
                  )}
                  {sub.deployment_url && (
                    <a href={sub.deployment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-blue-300 hover:text-white transition-colors">
                      <ExternalLink size={14} className="text-blue-400" />
                      Live App <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERDUE GRACE PERIOD WARNING ALERT */}
      {overview.delay_warning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mb-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300 mb-0.5">⚠️ Milestone Schedule Warning</p>
            <p className="text-gray-300">{overview.delay_warning}</p>
          </div>
        </div>
      )}

      {/* Progress Bar & Metrics */}
      <div className="glass-card p-5 border border-purple-500/20 mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400 font-semibold">Overall Project Completion</span>
          <span className="text-purple-300 font-extrabold">{sub ? 100 : overview.overall_progress_percentage}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${sub ? 100 : overview.overall_progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Tasks List with Action Buttons */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const isCompleted = task.status === 'COMPLETED' || !!sub;
          const isInProgress = task.status === 'IN_PROGRESS' && !sub;
          const isOverdue = (task.status === 'OVERDUE' || task.status === 'FAILED') && !sub;

          return (
            <div
              key={task.id}
              className={`glass-card p-5 border transition-all ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/15'
                  : isOverdue
                  ? 'border-red-500/40 bg-red-950/15'
                  : isInProgress
                  ? 'border-purple-500/40 bg-purple-950/15 shadow-lg'
                  : 'border-white/10 opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-purple text-[10px] font-bold px-2 py-0.5">
                      Phase {task.milestone_number}
                    </span>
                    <h4 className="text-white font-bold text-base">{task.task_name}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'badge-green'
                        : isInProgress
                        ? 'badge-blue'
                        : isOverdue
                        ? 'badge-red'
                        : 'badge-gray'
                    }`}>
                      {isCompleted ? 'COMPLETED' : task.status}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-gray-300 text-xs mb-2 leading-relaxed">{task.description}</p>
                  )}

                  {task.remarks && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/20 text-xs font-mono text-purple-300 mt-2">
                      <span className="text-gray-500 font-sans block text-[10px] uppercase font-bold mb-0.5">Submitted Proof:</span>
                      {task.remarks}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" />
                      Planned End: {new Date(task.planned_end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Freelancer Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isCompleted && (
                    <>
                      <button
                        onClick={() => setUploadTaskModal(task)}
                        disabled={isUpdating}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white/10 hover:bg-purple-500/20 text-purple-300 border border-white/10"
                      >
                        <Upload size={14} />
                        <span>Upload Progress</span>
                      </button>

                      <button
                        onClick={() => markTaskComplete(task.id)}
                        disabled={isUpdating}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        {isUpdating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Mark Complete</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {isCompleted && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-500/40">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>Completed ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPLOAD PROGRESS PROOF MODAL */}
      {uploadTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card gradient-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload size={20} className="text-purple-400" />
              Upload Progress Proof
            </h3>
            <p className="text-gray-400 text-xs">Task: {uploadTaskModal.task_name}</p>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">GitHub Commit URL</label>
              <input
                type="url"
                placeholder="https://github.com/org/repo/commit/..."
                value={commitUrl}
                onChange={e => setCommitUrl(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">Progress Description / Notes</label>
              <textarea
                placeholder="Describe progress made on this task..."
                rows={3}
                value={proofDesc}
                onChange={e => setProofDesc(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">Screenshot / File Path (Optional)</label>
              <input
                type="text"
                placeholder="proof_screenshot.png or code_archive.zip"
                value={filePath}
                onChange={e => setFilePath(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setUploadTaskModal(null)} className="btn-secondary flex-1 text-xs py-2.5">
                Cancel
              </button>
              <button onClick={handleUploadSubmit} disabled={isUpdating} className="btn-primary flex-1 text-xs py-2.5">
                {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Save Progress Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL PROJECT SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card gradient-border p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Send size={22} className="text-emerald-400" />
              Final Project Submission
            </h3>
            <p className="text-gray-300 text-xs">
              Upload your complete code ZIP file, repository link, and production deployment links for client review.
            </p>

            {/* ZIP File Upload Input */}
            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">Upload Project Code ZIP Archive *</label>
              {selectedZipFile || finalZipPath ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-[260px]">{selectedZipFile?.name || finalZipPath}</p>
                      <p className="text-emerald-400 text-[10px]">
                        {selectedZipFile ? `${(selectedZipFile.size / (1024 * 1024)).toFixed(2)} MB • ` : ''}Ready for Submission
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveZipFile}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-white/5 hover:bg-purple-500/5 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Upload size={24} className="text-purple-400 mb-1.5" />
                  <span className="text-white text-xs font-bold">Click to Select ZIP File</span>
                  <span className="text-gray-400 text-[11px] mt-0.5">Supports .zip, .rar, .7z files</span>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z"
                    onChange={handleZipFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">GitHub Repository Link (Optional)</label>
              <input
                type="url"
                placeholder="https://github.com/username/project-repo"
                value={finalGithubUrl}
                onChange={e => setFinalGithubUrl(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">Live Deployment URL (Optional)</label>
              <input
                type="url"
                placeholder="https://my-app.vercel.app"
                value={finalDeployUrl}
                onChange={e => setFinalDeployUrl(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="text-gray-300 text-xs font-semibold block mb-1">Documentation PDF Path (Optional)</label>
              <input
                type="text"
                placeholder="architecture_docs.pdf"
                value={finalDocPath}
                onChange={e => setFinalDocPath(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSubmitModal(false)} className="btn-secondary flex-1 text-xs py-2.5">
                Cancel
              </button>
              <button onClick={handleFinalSubmit} disabled={isUpdating} className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white flex-1 text-xs py-2.5 font-bold">
                {isUpdating ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Project to Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
