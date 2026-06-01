import { apiClient, APIError } from "../../../utils/apiClient";

/**
 * Resume API Service Layer
 * 
 * Features:
 * - Automatic error handling with user-friendly messages
 * - Request/response logging
 * - Retry logic for network failures
 * - Type safety with JSDoc comments
 */

/**
 * Fetch user's resume
 * @returns {Promise<Object>} Resume data
 * @throws {APIError} If fetch fails
 */
export const getResume = async () => {
  try {
    const response = await apiClient.get("/resume");
    
    if (!response.data) {
      throw new APIError("No resume found", 404, "NO_RESUME");
    }

    return response.data.resume || response.data;
  } catch (error) {
    console.error("[Resume API] Get resume failed:", error);
    throw error;
  }
};

/**
 * Save or update user's resume
 * @param {Object} data - Resume data to save
 * @returns {Promise<Object>} Saved resume
 * @throws {APIError} If save fails
 */
export const saveResume = async (data) => {
  try {
    if (!data || typeof data !== "object") {
      throw new APIError("Invalid resume data", 400, "INVALID_DATA");
    }

    const response = await apiClient.post("/resume", data);
    
    return response.data.resume || response.data;
  } catch (error) {
    console.error("[Resume API] Save resume failed:", error);
    throw error;
  }
};

/**
 * Improve resume using AI (ATS optimization)
 * @param {Object} data - Resume data to improve
 * @returns {Promise<Object>} Improved resume
 * @throws {APIError} If improvement fails
 */
export const improveResume = async (data) => {
  try {
    if (!data || typeof data !== "object") {
      throw new APIError("Invalid resume data", 400, "INVALID_DATA");
    }

    if (Object.keys(data).length === 0) {
      throw new APIError("Resume cannot be empty", 400, "EMPTY_RESUME");
    }

    const response = await apiClient.post("/resume/improve", data);
    
    return response.data.resume || response.data;
  } catch (error) {
    console.error("[Resume API] Improve resume failed:", error);
    throw error;
  }
};

/**
 * Analyze resume for ATS compatibility
 * @param {Object} data - Resume and optional job description
 * @returns {Promise<Object>} Analysis results with scores and recommendations
 * @throws {APIError} If analysis fails
 */
export const analyzeResume = async (data) => {
  try {
    if (!data || !data.resume) {
      throw new APIError("Resume is required for analysis", 400, "MISSING_RESUME");
    }

    const response = await apiClient.post("/resume/analyze", data);
    
    return response.data.analysis || response.data;
  } catch (error) {
    console.error("[Resume API] Analyze resume failed:", error);
    throw error;
  }
};

/**
 * Generate PDF from resume data
 * @param {Object} data - Resume data
 * @returns {Promise<Blob>} PDF file blob
 * @throws {APIError} If PDF generation fails
 */
export const downloadPDF = async (data) => {
  try {
    if (!data || typeof data !== "object") {
      throw new APIError("Invalid resume data for PDF", 400, "INVALID_DATA");
    }

    const response = await apiClient.post("/resume/pdf", data);
    
    // If response is a blob, return it directly
    if (response.data instanceof Blob) {
      return response.data;
    }

    // Otherwise, convert to blob
    return new Blob([JSON.stringify(response.data)], {
      type: "application/json",
    });
  } catch (error) {
    console.error("[Resume API] PDF download failed:", error);
    throw error;
  }
};

/**
 * Get resume error message for UI display
 * @param {APIError|Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getResumeErrorMessage = (error) => {
  if (error instanceof APIError) {
    switch (error.errorCode) {
      case "NO_RESUME":
        return "No resume found. Create a new one to get started.";
      case "INVALID_DATA":
        return "Invalid resume data. Please check your input.";
      case "EMPTY_RESUME":
        return "Resume cannot be empty. Please add some content.";
      case "MISSING_RESUME":
        return "Resume is required for this operation.";
      case "VALIDATION_ERROR":
        return "Please fix the validation errors and try again.";
      case "UNAUTHORIZED":
        return "You need to log in to access this feature.";
      case "FORBIDDEN":
        return "You don't have permission to access this resume.";
      case "NOT_FOUND":
        return "Resume not found.";
      case "CONFLICT":
        return "Resume was modified. Please refresh and try again.";
      case "RATE_LIMITED":
        return "Too many requests. Please wait a moment and try again.";
      case "AI_FAILED":
        return "AI service temporarily unavailable. Please try again.";
      case "PDF_GENERATION_FAILED":
        return "Could not generate PDF. Please try again.";
      default:
        return error.message || "An error occurred while processing your resume.";
    }
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return error?.message || "An unexpected error occurred.";
};
