/**
 * Donation Verification Utilities
 * Frontend-only storage and validation using localStorage
 */

export interface DonorEligibilityAnswers {
  healthyToday: boolean;
  donatedLast3Months: boolean;
  testedPositive: boolean;
  pregnantOrBreastfeeding: boolean;
  chronicIllness: boolean;
}

export interface DonorRequest {
  id: string;
  name: string;
  email: string;
  answers: DonorEligibilityAnswers;
  aadhaarFile: string; // Base64 encoded PDF
  medicalFile: string; // Base64 encoded PDF
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason: string;
  submittedAt: string;
}

const STORAGE_KEY = "donorRequests";

/**
 * Convert File to Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Return the base64 string without the data URI prefix
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate PDF file
 */
export const validatePdfFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (file.type !== "application/pdf") {
    return { valid: false, error: "Only PDF files are allowed" };
  }

  // Check file size (max 5MB = 5242880 bytes)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must not exceed 5MB" };
  }

  return { valid: true };
};

/**
 * Create a new donor request
 */
export const createDonorRequest = (
  name: string,
  email: string,
  answers: DonorEligibilityAnswers,
  aadhaarBase64: string,
  medicalBase64: string
): DonorRequest => {
  return {
    id: `DON-${Date.now()}`,
    name,
    email,
    answers,
    aadhaarFile: aadhaarBase64,
    medicalFile: medicalBase64,
    status: "Pending",
    rejectionReason: "",
    submittedAt: new Date().toLocaleString(),
  };
};

/**
 * Save donor request to localStorage
 */
export const saveDonorRequest = (request: DonorRequest): void => {
  try {
    const existingRequests = getDonorRequests();
    existingRequests.push(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRequests));
  } catch (error) {
    console.error("Failed to save donor request:", error);
    throw new Error("Failed to save donation request");
  }
};

/**
 * Get all donor requests from localStorage
 */
export const getDonorRequests = (): DonorRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve donor requests:", error);
    return [];
  }
};

/**
 * Get a specific donor request by ID
 */
export const getDonorRequestById = (id: string): DonorRequest | null => {
  const requests = getDonorRequests();
  return requests.find((req) => req.id === id) || null;
};

/**
 * Update donor request status to Approved
 */
export const approveDonorRequest = (id: string): boolean => {
  try {
    const requests = getDonorRequests();
    const request = requests.find((req) => req.id === id);

    if (!request) {
      console.error("Request not found");
      return false;
    }

    request.status = "Approved";
    request.rejectionReason = "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return true;
  } catch (error) {
    console.error("Failed to approve request:", error);
    return false;
  }
};

/**
 * Update donor request status to Rejected with reason
 */
export const rejectDonorRequest = (id: string, reason: string): boolean => {
  try {
    const requests = getDonorRequests();
    const request = requests.find((req) => req.id === id);

    if (!request) {
      console.error("Request not found");
      return false;
    }

    request.status = "Rejected";
    request.rejectionReason = reason;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return true;
  } catch (error) {
    console.error("Failed to reject request:", error);
    return false;
  }
};

/**
 * Generate a data URI for displaying Base64 PDF in iframe
 */
export const getPdfDataUri = (base64Content: string): string => {
  return `data:application/pdf;base64,${base64Content}`;
};

/**
 * Open PDF in a new tab using Base64
 */
export const openPdfInNewTab = (base64Content: string, fileName: string): void => {
  try {
    const dataUri = getPdfDataUri(base64Content);
    const link = document.createElement("a");
    link.href = dataUri;
    link.target = "_blank";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to open PDF:", error);
  }
};

/**
 * Set up a listener for real-time updates to donor requests
 * This uses localStorage events to detect changes in other components
 */
export const onDonorRequestsChange = (
  callback: (requests: DonorRequest[]) => void
): (() => void) => {
  // Initial call with current requests
  callback(getDonorRequests());

  // Listen for storage changes from other tabs/windows or components
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(getDonorRequests());
    }
  };

  // Also set up polling for same-tab updates (every 500ms)
  let lastCheck = JSON.stringify(getDonorRequests());
  const intervalId = setInterval(() => {
    const current = JSON.stringify(getDonorRequests());
    if (current !== lastCheck) {
      lastCheck = current;
      callback(getDonorRequests());
    }
  }, 500);

  window.addEventListener("storage", handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    clearInterval(intervalId);
  };
};
