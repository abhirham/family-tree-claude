"use client";

import { useState } from "react";
import {
  uploadProfileImage,
  uploadGalleryImages,
  validateImageFile,
  validateImageFiles,
  createImagePreview,
} from "@/lib/imageUpload";

export default function ImageUploadTest() {
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({
    profile: 0,
    gallery: 0,
  });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, { timestamp, message, type }]);
  };

  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        addResult("🔍 Validating profile image...", "info");
        validateImageFile(file);
        addResult("✅ Profile image validation passed", "success");

        setSelectedProfileFile(file);
        setError(null);

        addResult("📸 Creating preview...", "info");
        const preview = await createImagePreview(file);
        setProfileImagePreview(preview);
        addResult("✅ Preview created successfully", "success");
      } catch (err) {
        addResult(`❌ Profile image error: ${err.message}`, "error");
        setError(err.message);
      }
    }
  };

  const handleGalleryFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        addResult(`🔍 Validating ${files.length} gallery images...`, "info");
        validateImageFiles(files);
        addResult("✅ Gallery images validation passed", "success");

        setSelectedGalleryFiles(files);
        setError(null);

        addResult("📸 Creating previews...", "info");
        const previews = await Promise.all(
          files.map((file) => createImagePreview(file)),
        );
        setGalleryImagePreviews(previews);
        addResult(
          `✅ ${previews.length} previews created successfully`,
          "success",
        );
      } catch (err) {
        addResult(`❌ Gallery images error: ${err.message}`, "error");
        setError(err.message);
      }
    }
  };

  const testProfileUpload = async () => {
    if (!selectedProfileFile) {
      addResult("❌ No profile image selected", "error");
      return;
    }

    try {
      const tempMemberId = "test_" + Date.now();
      setUploadProgress((prev) => ({ ...prev, profile: 10 }));
      addResult("📤 Starting profile image upload...", "info");

      const result = await uploadProfileImage(
        selectedProfileFile,
        tempMemberId,
      );

      setUploadProgress((prev) => ({ ...prev, profile: 100 }));
      addResult(`✅ Profile upload successful!`, "success");
      addResult(`🔗 URL: ${result.url}`, "info");
      addResult(`📁 Path: ${result.path}`, "info");
    } catch (err) {
      addResult(`❌ Profile upload failed: ${err.message}`, "error");
      setUploadProgress((prev) => ({ ...prev, profile: 0 }));
    }
  };

  const testGalleryUpload = async () => {
    if (selectedGalleryFiles.length === 0) {
      addResult("❌ No gallery images selected", "error");
      return;
    }

    try {
      const tempMemberId = "test_" + Date.now();
      setUploadProgress((prev) => ({ ...prev, gallery: 10 }));
      addResult(
        `📤 Starting gallery upload (${selectedGalleryFiles.length} images)...`,
        "info",
      );

      const results = await uploadGalleryImages(
        selectedGalleryFiles,
        tempMemberId,
      );

      setUploadProgress((prev) => ({ ...prev, gallery: 100 }));
      addResult(
        `✅ Gallery upload successful! ${results.length} images uploaded`,
        "success",
      );
      results.forEach((result, index) => {
        addResult(`🔗 Image ${index + 1}: ${result.url}`, "info");
      });
    } catch (err) {
      addResult(`❌ Gallery upload failed: ${err.message}`, "error");
      setUploadProgress((prev) => ({ ...prev, gallery: 0 }));
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Image Upload Test
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Image Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Profile Image Test
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {profileImagePreview && (
            <div className="relative">
              <img
                src={profileImagePreview}
                alt="Profile Preview"
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
              />
            </div>
          )}

          <button
            onClick={testProfileUpload}
            disabled={!selectedProfileFile}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {uploadProgress.profile > 0 && uploadProgress.profile < 100
              ? `Uploading... ${uploadProgress.profile}%`
              : "Test Profile Upload"}
          </button>
        </div>

        {/* Gallery Images Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Gallery Images Test
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFilesChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          {galleryImagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {galleryImagePreviews.map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt={`Gallery Preview ${index + 1}`}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                />
              ))}
            </div>
          )}

          <button
            onClick={testGalleryUpload}
            disabled={selectedGalleryFiles.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
          >
            {uploadProgress.gallery > 0 && uploadProgress.gallery < 100
              ? `Uploading... ${uploadProgress.gallery}%`
              : "Test Gallery Upload"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Test Results</h3>
          <button
            onClick={clearResults}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No test results yet. Select images and run tests.
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${
                    result.type === "error"
                      ? "text-red-600"
                      : result.type === "success"
                        ? "text-green-600"
                        : "text-gray-600"
                  }`}
                >
                  <span className="text-gray-400">[{result.timestamp}]</span>{" "}
                  {result.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
