'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Course, CourseLecture, CourseExam, Database } from '@/lib/db';

interface CourseContentManagerProps {
  course: Course;
  db: Database;
  onUpdate: (updatedDb: Database) => void;
  onClose: () => void;
}

export default function CourseContentManager({ course, db, onUpdate, onClose }: CourseContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'lectures' | 'exams'>('lectures');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lecture form state
  const [newLecture, setNewLecture] = useState({
    title: '',
    description: '',
    file: null as File | null,
    fileUrl: '',
    duration: '',
  });

  // Exam form state
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    file: null as File | null,
    fileUrl: '',
    timeLimitMinutes: 60,
    totalPoints: 100,
    passingScore: 60,
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, type: 'lecture' | 'exam') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'lecture') {
      setNewLecture({ ...newLecture, file, fileUrl: URL.createObjectURL(file) });
    } else {
      setNewExam({ ...newExam, file, fileUrl: URL.createObjectURL(file) });
    }
  };

  // Simulate file upload to Neon (in production, this would upload to a storage service)
  const uploadFileToStorage = async (file: File): Promise<{ url: string; fileName: string; fileType: string; fileSize: number }> => {
    // In a real implementation, you would:
    // 1. Upload to a storage service (S3, Cloudflare R2, etc.)
    // 2. Return the public URL
    // For now, we'll simulate this with a local object URL
    
    return {
      url: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  };

  // Add lecture to course
  const handleAddLecture = async () => {
    if (!newLecture.title || !newLecture.file) {
      showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(i);
      }

      // Upload file
      const uploadedFile = await uploadFileToStorage(newLecture.file);

      // Create new lecture object
      const lecture: CourseLecture = {
        id: `lecture_${Date.now()}`,
        courseId: course.id,
        title: newLecture.title,
        description: newLecture.description,
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        duration: newLecture.duration || '60 دقيقة',
        order: (course.lectures?.length || 0) + 1,
        isPublished: true,
        createdAt: new Date().toISOString(),
      };

      // Update database
      const updatedDb = {
        ...db,
        lectures: [...(db.lectures || []), lecture],
        courses: db.courses.map(c => 
          c.id === course.id 
            ? { ...c, lectures: [...(c.lectures || []), lecture] } 
            : c
        ),
      };

      onUpdate(updatedDb);
      showNotification(`تم إضافة محاضرة "${newLecture.title}" بنجاح!`);

      // Reset form
      setNewLecture({
        title: '',
        description: '',
        file: null,
        fileUrl: '',
        duration: '',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showNotification('فشل رفع الملف، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Add exam to course
  const handleAddExam = async () => {
    if (!newExam.title) {
      showNotification('يرجى ملء عنوان الاختبار على الأقل', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(i);
      }

      // Upload file if exists
      let fileData = {
        fileUrl: '',
        fileName: '',
        fileType: '',
        fileSize: 0,
      };

      if (newExam.file) {
        const uploadedFile = await uploadFileToStorage(newExam.file);
        fileData = {
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.fileName,
          fileType: uploadedFile.fileType,
          fileSize: uploadedFile.fileSize,
        };
      }

      // Create new exam object
      const exam: CourseExam = {
        id: `exam_${Date.now()}`,
        courseId: course.id,
        title: newExam.title,
        description: newExam.description,
        ...fileData,
        questions: [], // Empty array for now, can be populated later
        timeLimitMinutes: newExam.timeLimitMinutes,
        totalPoints: newExam.totalPoints,
        passingScore: newExam.passingScore,
        isPublished: true,
        order: (course.exams?.length || 0) + 1,
        createdAt: new Date().toISOString(),
      };

      // Update database
      const updatedDb = {
        ...db,
        exams: [...(db.exams || []), exam],
        courses: db.courses.map(c => 
          c.id === course.id 
            ? { ...c, exams: [...(c.exams || []), exam] } 
            : c
        ),
      };

      onUpdate(updatedDb);
      showNotification(`تم إضافة اختبار "${newExam.title}" بنجاح!`);

      // Reset form
      setNewExam({
        title: '',
        description: '',
        file: null,
        fileUrl: '',
        timeLimitMinutes: 60,
        totalPoints: 100,
        passingScore: 60,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showNotification('فشل إنشاء الاختبار، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Delete lecture
  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه المحاضرة؟')) return;

    try {
      const updatedDb = {
        ...db,
        lectures: (db.lectures || []).filter(l => l.id !== lectureId),
        courses: db.courses.map(c => 
          c.id === course.id 
            ? { ...c, lectures: (c.lectures || []).filter(l => l.id !== lectureId) } 
            : c
        ),
      };

      onUpdate(updatedDb);
      showNotification('تم حذف المحاضرة بنجاح');
    } catch (error) {
      showNotification('فشل حذف المحاضرة', 'error');
    }
  };

  // Delete exam
  const handleDeleteExam = async (examId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الاختبار؟')) return;

    try {
      const updatedDb = {
        ...db,
        exams: (db.exams || []).filter(e => e.id !== examId),
        courses: db.courses.map(c => 
          c.id === course.id 
            ? { ...c, exams: (c.exams || []).filter(e => e.id !== examId) } 
            : c
        ),
      };

      onUpdate(updatedDb);
      showNotification('تم حذف الاختبار بنجاح');
    } catch (error) {
      showNotification('فشل حذف الاختبار', 'error');
    }
  };

  // Get course lectures
  const courseLectures = db.lectures?.filter(l => l.courseId === course.id) || [];
  
  // Get course exams
  const courseExams = db.exams?.filter(e => e.courseId === course.id) || [];

  // Helper function to get file icon
  const getFileIcon = (fileType: string | undefined, fileName: string | undefined) => {
    if (fileType?.includes('html') || fileName?.endsWith('.html')) return '🌐';
    if (fileType?.includes('pdf') || fileName?.endsWith('.pdf')) return '📄';
    if (fileType?.includes('video') || fileName?.match(/\.(mp4|mov|avi|webm)$/i)) return '🎥';
    if (fileType?.includes('presentation') || fileName?.match(/\.(ppt|pptx)$/i)) return '📑';
    return '📄';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full p-6 rounded-3xl bg-[#0c142b] border border-indigo-500/40 shadow-2xl space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>📚</span>
              <span>إدارة محتوى مقرر {course.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              إضافة وتعديل محاضرات واختبارات الكورس
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Toast Notification */}
        {statusMessage && (
          <div
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border border-rose-500/50 text-rose-200'
            }`}
          >
            <span>{statusMessage.type === 'success' ? '✅' : '❌'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('lectures')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lectures'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📝 المحاضرات ({courseLectures.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📋 الاختبارات ({courseExams.length})
          </button>
        </div>

        {/* Lectures Tab */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            {/* Add New Lecture Form */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>➕</span>
                <span>إضافة محاضرة جديدة</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">عنوان المحاضرة *</label>
                  <input
                    type="text"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                    placeholder="مثال: محاضرة في أمراض القلب"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">المدة التقريبية</label>
                  <input
                    type="text"
                    value={newLecture.duration}
                    onChange={(e) => setNewLecture({ ...newLecture, duration: e.target.value })}
                    placeholder="مثال: 60 دقيقة"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">وصف المحاضرة</label>
                  <textarea
                    value={newLecture.description}
                    onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                    placeholder="وصف مختصر لمحتوى المحاضرة..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm resize-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">ملف المحاضرة (PDF, PPT, DOCX, Video, HTML) *</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, 'lecture')}
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.avi,.webm,.html"
                      className="flex-1"
                    />
                    {newLecture.file && (
                      <span className="text-xs text-emerald-400 font-mono">
                        {newLecture.file.name} ({Math.round(newLecture.file.size / 1024)} KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddLecture}
                disabled={uploading || !newLecture.title || !newLecture.file}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">🌀</span>
                    <span>جاري الرفع... {progress}%</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>إضافة المحاضرة إلى الكورس</span>
                  </>
                )}
              </button>
            </div>

            {/* Lectures List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {courseLectures.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  <span className="text-3xl">📄</span>
                  <p className="mt-2">لا توجد محاضرات بعد</p>
                  <p className="text-xs mt-1">إضافة أول محاضرة لبدء بناء محتوى الكورس</p>
                </div>
              ) : (
                courseLectures.map((lecture) => (
                  <div
                    key={lecture.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getFileIcon(lecture.fileType, lecture.fileName)}</span>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{lecture.title}</h4>
                        </div>
                        {lecture.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lecture.description}</p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          {lecture.duration} • {Math.round(lecture.fileSize / 1024)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteLecture(lecture.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                        title="حذف المحاضرة"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full ${
                        lecture.isPublished 
                          ? 'bg-emerald-950 text-emerald-300' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {lecture.isPublished ? 'منشور' : 'مسودة'}
                      </span>
                      <span>#{(courseLectures.findIndex(l => l.id === lecture.id) + 1)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            {/* Add New Exam Form */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>➕</span>
                <span>إضافة اختبار جديد</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">عنوان الاختبار *</label>
                  <input
                    type="text"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                    placeholder="مثال: اختبار نهائي في الفسيولوجيا"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">الوقت المحدد (دقائق)</label>
                  <input
                    type="number"
                    value={newExam.timeLimitMinutes}
                    onChange={(e) => setNewExam({ ...newExam, timeLimitMinutes: Number(e.target.value) })}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">الدرجة الكلية</label>
                  <input
                    type="number"
                    value={newExam.totalPoints}
                    onChange={(e) => setNewExam({ ...newExam, totalPoints: Number(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">درجة النجاح</label>
                  <input
                    type="number"
                    value={newExam.passingScore}
                    onChange={(e) => setNewExam({ ...newExam, passingScore: Number(e.target.value) })}
                    min="0"
                    max={newExam.totalPoints}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">وصف الاختبار</label>
                  <textarea
                    value={newExam.description}
                    onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                    placeholder="وصف مختصر لمحتوى الاختبار..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm resize-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">ملف الاختبار (PDF, DOCX, HTML - اختياري)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'exam')}
                      accept=".pdf,.doc,.docx,.html"
                      className="flex-1"
                    />
                    {newExam.file && (
                      <span className="text-xs text-emerald-400 font-mono">
                        {newExam.file.name} ({Math.round(newExam.file.size / 1024)} KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddExam}
                disabled={uploading || !newExam.title}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">🌀</span>
                    <span>جاري الإنشاء... {progress}%</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>إضافة الاختبار إلى الكورس</span>
                  </>
                )}
              </button>
            </div>

            {/* Exams List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {courseExams.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  <span className="text-3xl">📝</span>
                  <p className="mt-2">لا توجد اختبارات بعد</p>
                  <p className="text-xs mt-1">إضافة أول اختبار لتقييم الطلاب</p>
                </div>
              ) : (
                courseExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getFileIcon(exam.fileType, exam.fileName)}</span>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{exam.title}</h4>
                        </div>
                        {exam.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{exam.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span>⏱️ {exam.timeLimitMinutes} دقيقة</span>
                          <span>🎯 {exam.totalPoints} درجة</span>
                          <span>✅ {exam.passingScore}% نجاح</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                        title="حذف الاختبار"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full ${
                        exam.isPublished 
                          ? 'bg-amber-950 text-amber-300' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {exam.isPublished ? 'منشور' : 'مسودة'}
                      </span>
                      <span>#{(courseExams.findIndex(e => e.id === exam.id) + 1)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
