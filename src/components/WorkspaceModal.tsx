import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  getDriveFileText,
  DriveFile,
} from '../services/googleDriveService';
import {
  listClassroomCourses,
  listCourseWork,
  listAnnouncements,
  ClassroomCourse,
  CourseWork,
  Announcement,
} from '../services/googleClassroomService';
import { TranscriptTurn } from './LiveTranscript';
import {
  X,
  HardDrive,
  GraduationCap,
  Search,
  ExternalLink,
  Upload,
  Trash2,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  LogIn,
} from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  turns: TranscriptTurn[];
  currentModelVoice: string;
  onLoadContextIntoPrompt: (contextText: string, contextTitle: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  turns,
  currentModelVoice,
  onLoadContextIntoPrompt,
}) => {
  const { user, accessToken, getOrRequestAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'drive' | 'classroom'>('drive');

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [uploadSuccessLink, setUploadSuccessLink] = useState<{ name: string; url: string } | null>(null);

  // Destructive delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Google Classroom state
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseWork, setCourseWork] = useState<CourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingClassroom, setLoadingClassroom] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);

  // Auth connecting state
  const [connecting, setConnecting] = useState(false);
  const [contextNotification, setContextNotification] = useState<string | null>(null);

  const fetchDrive = async (token: string, search: string = '') => {
    setLoadingDrive(true);
    setDriveError(null);
    try {
      const data = await listDriveFiles(token, search);
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.warn('Google Drive fetch notice:', err);
      setDriveError(err?.message || 'Failed to fetch Google Drive files.');
    } finally {
      setLoadingDrive(false);
    }
  };

  const fetchClassroom = async (token: string) => {
    setLoadingClassroom(true);
    setClassroomError(null);
    try {
      const data = await listClassroomCourses(token);
      setCourses(data.courses || []);
      if (data.courses?.length > 0 && !selectedCourse) {
        handleSelectCourse(token, data.courses[0]);
      }
    } catch (err: any) {
      console.warn('Google Classroom fetch notice:', err);
      setClassroomError(err?.message || 'Failed to fetch Google Classroom courses.');
    } finally {
      setLoadingClassroom(false);
    }
  };

  const handleSelectCourse = async (token: string, course: ClassroomCourse) => {
    setSelectedCourse(course);
    setLoadingClassroom(true);
    try {
      const [cwData, annData] = await Promise.all([
        listCourseWork(token, course.id).catch(() => ({ courseWork: [] })),
        listAnnouncements(token, course.id).catch(() => ({ announcements: [] })),
      ]);
      setCourseWork(cwData.courseWork || []);
      setAnnouncements(annData.announcements || []);
    } catch (err: any) {
      console.warn('Error fetching course details:', err);
    } finally {
      setLoadingClassroom(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      if (activeTab === 'drive') {
        fetchDrive(accessToken, driveSearch);
      } else {
        fetchClassroom(accessToken);
      }
    }
  }, [isOpen, activeTab, accessToken]);

  const handleConnectWorkspace = async () => {
    try {
      setConnecting(true);
      const token = await getOrRequestAccessToken();
      if (token) {
        if (activeTab === 'drive') {
          fetchDrive(token, driveSearch);
        } else {
          fetchClassroom(token);
        }
      }
    } catch (err) {
      console.warn('Workspace authorization error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveTranscriptToDrive = async () => {
    if (turns.length === 0) return;
    try {
      setUploadingToDrive(true);
      const token = accessToken || (await getOrRequestAccessToken());
      if (!token) return;

      const now = new Date();
      const filename = `LiveVoice_Transcript_${now.toISOString().slice(0, 10)}_${now
        .toTimeString()
        .slice(0, 8)
        .replace(/:/g, '-')}.txt`;

      const content = [
        '==================================================',
        'LiveVoice AI - Conversation Transcript',
        `Date: ${now.toLocaleString()}`,
        `Model Voice: ${currentModelVoice}`,
        `Total Turns: ${turns.length}`,
        '==================================================\n',
        ...turns.map(
          (t) =>
            `[${new Date(t.timestamp).toLocaleTimeString()}] ${
              t.role === 'user' ? 'User' : `Gemini (${currentModelVoice})`
            }:\n${t.text}\n`
        ),
      ].join('\n');

      const savedFile = await uploadFileToDrive(token, filename, content, 'text/plain');
      setUploadSuccessLink({
        name: savedFile.name,
        url: savedFile.webViewLink || 'https://drive.google.com',
      });
      setTimeout(() => setUploadSuccessLink(null), 8000);
      fetchDrive(token, driveSearch);
    } catch (err: any) {
      setDriveError(err?.message || 'Failed to upload transcript to Google Drive');
    } finally {
      setUploadingToDrive(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setDeletingFile(true);
      const token = accessToken || (await getOrRequestAccessToken());
      if (token) {
        await deleteDriveFile(token, fileToDelete.id);
        setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      }
    } catch (err: any) {
      setDriveError(err?.message || 'Failed to delete file from Drive');
    } finally {
      setDeletingFile(false);
      setFileToDelete(null);
    }
  };

  const handleDiscussDriveFile = async (file: DriveFile) => {
    try {
      const token = accessToken || (await getOrRequestAccessToken());
      if (!token) return;
      const text = await getDriveFileText(token, file);
      const context = `[DOCUMENT CONTEXT: ${file.name}]\n${text.slice(0, 3000)}\n[END DOCUMENT CONTEXT]\nPlease discuss this document with the user during the live session.`;
      onLoadContextIntoPrompt(context, `Drive: ${file.name}`);
      setContextNotification(`Loaded "${file.name}" into Live Voice context!`);
      setTimeout(() => setContextNotification(null), 4000);
    } catch (err: any) {
      setDriveError(err?.message || 'Could not read file content for voice context.');
    }
  };

  const handleDiscussClassroomWork = (work: CourseWork) => {
    const context = `[CLASSROOM ASSIGNMENT: "${work.title}" for course "${selectedCourse?.name || 'Classroom'}"]\nDescription: ${work.description || 'No description provided.'}\nMax Points: ${work.maxPoints || 'Ungraded'}\n[END CONTEXT]\nPlease act as an empathetic, knowledgeable academic tutor and help the user study or complete this assignment.`;
    onLoadContextIntoPrompt(context, `Classroom: ${work.title}`);
    setContextNotification(`Loaded assignment "${work.title}" into Live Voice context!`);
    setTimeout(() => setContextNotification(null), 4000);
  };

  const handleDiscussAnnouncement = (ann: Announcement) => {
    const context = `[CLASSROOM ANNOUNCEMENT from "${selectedCourse?.name || 'Classroom'}"]\nAnnouncement: ${ann.text}\n[END CONTEXT]\nPlease discuss this class announcement and answer any questions the user may have.`;
    onLoadContextIntoPrompt(context, `Class Announcement`);
    setContextNotification(`Loaded announcement into Live Voice context!`);
    setTimeout(() => setContextNotification(null), 4000);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('presentation')) return <BookOpen className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('json') || mimeType.includes('code')) return <FileCode className="w-4 h-4 text-purple-400" />;
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[88vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Google Workspace Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Drive & Classroom
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Sync transcripts, inspect documents, and launch voice study sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Google Drive</span>
            </button>
            <button
              onClick={() => setActiveTab('classroom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'classroom'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Google Classroom</span>
            </button>
          </div>

          {/* Quick Connect / Sign-in if access token needed */}
          {!accessToken && (
            <button
              onClick={handleConnectWorkspace}
              disabled={connecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{connecting ? 'Connecting...' : 'Authorize Workspace'}</span>
            </button>
          )}
        </div>

        {/* Global Toast Notification */}
        {contextNotification && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{contextNotification}</span>
          </div>
        )}

        {/* Upload Success Alert */}
        {uploadSuccessLink && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Transcript saved to Drive as <strong>{uploadSuccessLink.name}</strong>
              </span>
            </div>
            <a
              href={uploadSuccessLink.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 underline text-white hover:text-purple-200"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800">
          {!accessToken ? (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-purple-400 mb-4 border border-neutral-700">
                {activeTab === 'drive' ? (
                  <HardDrive className="w-8 h-8" />
                ) : (
                  <GraduationCap className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Connect {activeTab === 'drive' ? 'Google Drive' : 'Google Classroom'}
              </h3>
              <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                {activeTab === 'drive'
                  ? 'Connect Google Drive with permission to save your voice transcripts, browse documents, and analyze files with Gemini.'
                  : 'Connect Google Classroom with permission to view your active courses, inspect coursework assignments, and launch voice study buddy sessions.'}
              </p>
              <button
                onClick={handleConnectWorkspace}
                disabled={connecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-purple-600" />
                <span>{connecting ? 'Authorizing...' : 'Connect with Google'}</span>
              </button>
            </div>
          ) : activeTab === 'drive' ? (
            /* =================== GOOGLE DRIVE VIEW =================== */
            <div className="space-y-5">
              {/* Quick Save Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    Save Conversation to Drive
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {turns.length > 0
                      ? `Ready to upload current session (${turns.length} turns) directly to your Google Drive.`
                      : 'No active transcript turns to save. Speak with Gemini first to create a transcript.'}
                  </div>
                </div>
                <button
                  onClick={handleSaveTranscriptToDrive}
                  disabled={uploadingToDrive || turns.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingToDrive ? 'Uploading...' : 'Save Transcript to Drive'}</span>
                </button>
              </div>

              {/* Search & Refresh */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDrive(accessToken, driveSearch)}
                    placeholder="Search Google Drive files..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => fetchDrive(accessToken, driveSearch)}
                  disabled={loadingDrive}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Refresh files"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDrive ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>

              {driveError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {driveError}
                </div>
              )}

              {/* Files Table / List */}
              <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/40">
                <div className="px-4 py-2.5 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 flex items-center justify-between">
                  <span>Drive Files ({driveFiles.length})</span>
                  <span>Actions</span>
                </div>

                {loadingDrive ? (
                  <div className="p-8 text-center text-xs text-neutral-500 animate-pulse">
                    Loading your Google Drive files...
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No files found in Google Drive matching the query.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/60 max-h-72 overflow-y-auto scrollbar-thin">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate max-w-[220px] sm:max-w-xs md:max-w-sm">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleDateString()
                                : 'Recent'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Discuss in Voice button */}
                          <button
                            onClick={() => handleDiscussDriveFile(file)}
                            title="Discuss this file with Gemini Voice"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="hidden sm:inline">Discuss in Voice</span>
                          </button>

                          {/* Open external link */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Open in Google Drive"
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete File button (triggers explicit confirmation dialog) */}
                          <button
                            onClick={() => setFileToDelete(file)}
                            title="Delete file from Google Drive"
                            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =================== GOOGLE CLASSROOM VIEW =================== */
            <div className="space-y-5">
              {classroomError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {classroomError}
                </div>
              )}

              {/* Course Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Select Active Course
                </label>
                {courses.length === 0 && !loadingClassroom ? (
                  <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400 text-center">
                    No active courses found in Google Classroom.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {courses.map((course) => {
                      const isSelected = selectedCourse?.id === course.id;
                      return (
                        <button
                          key={course.id}
                          onClick={() => handleSelectCourse(accessToken, course)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{course.name}</div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {course.section || course.room || 'Active Class'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Course Content: CourseWork & Announcements */}
              {selectedCourse && (
                <div className="space-y-4 pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                      Assignments & CourseWork ({courseWork.length})
                    </h4>
                    {selectedCourse.alternateLink && (
                      <a
                        href={selectedCourse.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Classroom</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {courseWork.length === 0 ? (
                    <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/80 text-xs text-neutral-500 text-center">
                      No active assignments found for this course.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                      {courseWork.map((work) => (
                        <div
                          key={work.id}
                          className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {work.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                              {work.dueDate && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Calendar className="w-3 h-3" />
                                  Due: {work.dueDate.month}/{work.dueDate.day}
                                </span>
                              )}
                              {work.maxPoints && <span>{work.maxPoints} pts</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDiscussClassroomWork(work)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 text-xs font-medium transition-colors cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Study with Voice</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Announcements */}
                  {announcements.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-white">Class Announcements</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                        {announcements.map((ann) => (
                          <div
                            key={ann.id}
                            className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-start justify-between gap-3"
                          >
                            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                              {ann.text}
                            </p>
                            <button
                              onClick={() => handleDiscussAnnouncement(ann)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                            >
                              Discuss
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Workspace APIs authorized via Google OAuth</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Operations (File Deletion) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm File Deletion</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">"{fileToDelete.name}"</strong> from your Google Drive?
              This operation cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={deletingFile}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={deletingFile}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg cursor-pointer"
              >
                {deletingFile ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
