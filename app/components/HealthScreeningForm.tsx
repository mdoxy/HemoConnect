import { useState } from 'react';
import { 
  Heart, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  AlertTriangle,
  Activity,
  User,
  Upload,
  FileText
} from 'lucide-react';
import {
  saveDonorRequest,
  createDonorRequest,
  fileToBase64,
  validatePdfFile,
  DonorEligibilityAnswers
} from '../utils/donationVerification';
import { apiUrl } from '../services/api';

interface FormData {
  fullName: string;
  email: string;
  feelingHealthy: boolean | null;
  recentDonation: boolean | null;
  bloodborneInfection: boolean | null;
  pregnantBreastfeeding: boolean | null;
  onMedication: boolean | null;
}

interface EligibilityResult {
  eligible: boolean;
  issues: string[];
}

interface FormErrors {
  [key: string]: string;
}

interface HealthScreeningFormProps {
  userId?: string;
  authToken?: string;
}

export default function HealthScreeningForm({ userId, authToken }: HealthScreeningFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    feelingHealthy: null,
    recentDonation: null,
    bloodborneInfection: null,
    pregnantBreastfeeding: null,
    onMedication: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Document verification state
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [medicalCertFile, setMedicalCertFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('not_verified');
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);

  const questions: Array<{
    id: keyof FormData;
    question: string;
    description: string;
    safeAnswer: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: 'feelingHealthy',
      question: 'Are you feeling healthy today?',
      description: 'No fever, cold, infection, weakness, or illness',
      safeAnswer: true,
      icon: <Activity className="w-5 h-5 text-red-600" />
    },
    {
      id: 'recentDonation',
      question: 'Have you donated blood in the last 3 months?',
      description: 'To ensure safe recovery time between donations',
      safeAnswer: false,
      icon: <Heart className="w-5 h-5 text-red-600" />
    },
    {
      id: 'bloodborneInfection',
      question: 'Have you ever tested positive for HIV, Hepatitis B/C, or any blood-borne infection?',
      description: 'To prevent transmission to recipients',
      safeAnswer: false,
      icon: <Shield className="w-5 h-5 text-red-600" />
    },
    {
      id: 'pregnantBreastfeeding',
      question: 'Are you currently pregnant, breastfeeding, or recently delivered a baby? (for women)',
      description: 'To protect mother and child health',
      safeAnswer: false,
      icon: <User className="w-5 h-5 text-red-600" />
    },
    {
      id: 'onMedication',
      question: 'Are you currently taking any medication or undergoing medical treatment?',
      description: 'Some medications can make donation unsafe',
      safeAnswer: false,
      icon: <AlertCircle className="w-5 h-5 text-red-600" />
    }
  ];

  const handleAnswerChange = (questionId: keyof FormData, value: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
    
    // Reset submission state
    setSubmitted(false);
    setEligibilityResult(null);
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    questions.forEach(question => {
      const key = question.id as keyof FormData;
      if (formData[key] === null) {
        newErrors[question.id] = 'This question is required';
      }
    });
    
    return newErrors;
  };

  const checkEligibility = (): EligibilityResult => {
    const issues: string[] = [];
    
    questions.forEach(question => {
      const key = question.id as keyof FormData;
      if (formData[key] !== question.safeAnswer) {
        issues.push(question.question);
      }
    });
    
    return {
      eligible: issues.length === 0,
      issues: issues
    };
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
            <CheckCircle className="w-4 h-4" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
            <AlertCircle className="w-4 h-4" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
            <AlertCircle className="w-4 h-4" />
            Not Verified
          </span>
        );
    }
  };

  const handleVerificationSubmit = async () => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!aadharFile) {
      newErrors.aadhar = 'Aadhar card is required';
    }
    if (!medicalCertFile) {
      newErrors.medical = 'Medical fitness certificate is required';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));

    if (Object.keys(newErrors).length === 0 && !isSubmittingDocs) {
      setIsSubmittingDocs(true);
      try {
        // Get token from localStorage if not passed as prop
        const token = authToken || localStorage.getItem('token');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token) {
          setErrors(prev => ({ 
            ...prev, 
            submit: 'Authentication required. Please login first.'
          }));
          setIsSubmittingDocs(false);
          return;
        }

        // Create eligibility answers from form data
        const answers: DonorEligibilityAnswers = {
          healthyToday: formData.feelingHealthy as boolean,
          donatedLast3Months: formData.recentDonation as boolean,
          testedPositive: formData.bloodborneInfection as boolean,
          pregnantOrBreastfeeding: formData.pregnantBreastfeeding as boolean,
          chronicIllness: formData.onMedication as boolean,
        };

        // Create FormData for multipart upload
        const formDataToSend = new FormData();
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('eligibilityAnswers', JSON.stringify(answers));
        formDataToSend.append('aadhaarFile', aadharFile!);
        formDataToSend.append('medicalFile', medicalCertFile!);
        if (currentUser?.bloodType) {
          formDataToSend.append('bloodType', currentUser.bloodType);
        }
        if (currentUser?.phone) {
          formDataToSend.append('phone', currentUser.phone);
        }

        console.log('Submitting donor application payload:', {
          fullName: formData.fullName,
          email: formData.email,
          hasAadhaarFile: Boolean(aadharFile),
          hasMedicalFile: Boolean(medicalCertFile),
          endpoint: apiUrl('/donor/apply'),
        });

        const response = await fetch(apiUrl('/donor/apply'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await response.json()
          : { message: await response.text() };

        console.log('Donor application response:', {
          status: response.status,
          ok: response.ok,
          data,
        });

        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit application');
        }

        // Success - show message and reset
        setVerificationStatus('pending');
        setSuccessMessage(`Application submitted successfully! (ID: ${data.applicationId})`);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          handleReset();
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Application submission error:', error);
        setErrors(prev => ({ 
          ...prev, 
          submit: error instanceof Error ? error.message : 'Failed to submit application. Please try again.'
        }));
      } finally {
        setIsSubmittingDocs(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const result = checkEligibility();
    setEligibilityResult(result);
    setSubmitted(true);

    // If donor is eligible and docs are already uploaded, submit to backend directly.
    if (result.eligible && aadharFile && medicalCertFile) {
      void handleVerificationSubmit();
      return;
    }

    // Make next step explicit when users only submit screening answers.
    if (result.eligible && (!aadharFile || !medicalCertFile)) {
      setErrors(prev => ({
        ...prev,
        submit: 'Eligibility check passed. Please upload both documents and click Submit for Verification to save in database.',
      }));
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      feelingHealthy: null,
      recentDonation: null,
      bloodborneInfection: null,
      pregnantBreastfeeding: null,
      onMedication: null
    });
    setErrors({});
    setSubmitted(false);
    setEligibilityResult(null);
    setAadharFile(null);
    setMedicalCertFile(null);
    setVerificationStatus('not_verified');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Blood Donor Health Screening</h1>
              <p className="text-red-100 mt-1">Please answer all questions honestly and accurately</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-b-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">{successMessage}</p>
              </div>
            )}

            {/* Donor Information Section */}
            <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Raj Sharma"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important Information</p>
                  <p>
                    Your honest answers help ensure the safety of both donors and recipients. 
                    All information is kept confidential and used only for health screening purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    errors[question.id] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-red-200'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        {question.icon}
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {question.question}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">
                        {question.description}
                      </p>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="ml-11 flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(question.id, true)}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                        formData[question.id] === true
                          ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600 ring-offset-2'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(question.id, false)}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                        formData[question.id] === false
                          ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600 ring-offset-2'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      NO
                    </button>
                  </div>

                  {/* Error Message */}
                  {errors[question.id] && (
                    <div className="ml-11 mt-3 flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors[question.id]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Screening Button */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                Check Eligibility & Continue
              </button>
            </div>

            {/* Eligibility Result */}
            {submitted && eligibilityResult && (
              <div className="mt-8">
                {eligibilityResult.eligible ? (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-900 mb-2">
                          ✓ Eligible to Donate Blood
                        </h3>
                        <p className="text-green-800 mb-3">
                          Based on your responses, you meet the health criteria for blood donation. 
                          Thank you for your willingness to save lives!
                        </p>
                        <p className="text-sm text-green-700">
                          Please proceed to the next step of the donation process or schedule an appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-900 mb-2">
                          ⚠ Not Eligible at This Time
                        </h3>
                        <p className="text-red-800 mb-3">
                          Based on your responses, you may not be eligible to donate blood at this time. 
                          This is for your safety and the safety of potential recipients.
                        </p>
                        <div className="bg-white rounded-lg p-4 mb-3">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Reasons for ineligibility:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {eligibilityResult.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-red-700">
                          Please consult with our medical staff if you have questions about your eligibility. 
                          Some restrictions are temporary.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start Over Button - shown after submission */}
            {submitted && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Start Over
                </button>
              </div>
            )}

            {/* Identity Verification Section */}
            <div className="mt-8 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-600" />
                      Identity Verification
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload your documents for verification
                    </p>
                  </div>
                  {getVerificationBadge()}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Aadhar Card Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Aadhar Card *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="aadhar-upload"
                    />
                    <label
                      htmlFor="aadhar-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {aadharFile ? aadharFile.name : 'Choose file or drag here'}
                      </span>
                    </label>
                  </div>
                  {aadharFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <FileText className="w-4 h-4" />
                      <span>{aadharFile.name}</span>
                    </div>
                  )}
                  {errors.aadhar && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.aadhar}
                    </p>
                  )}
                </div>

                {/* Medical Fitness Certificate Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Medical Fitness Certificate *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setMedicalCertFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="medical-upload"
                    />
                    <label
                      htmlFor="medical-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {medicalCertFile ? medicalCertFile.name : 'Choose file or drag here'}
                      </span>
                    </label>
                  </div>
                  {medicalCertFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <FileText className="w-4 h-4" />
                      <span>{medicalCertFile.name}</span>
                    </div>
                  )}
                  {errors.medical && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.medical}
                    </p>
                  )}
                </div>

                {/* Verification Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Verification Requirements</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Documents must be clear and legible</li>
                        <li>Accepted formats: PDF, JPG, PNG</li>
                        <li>Verification typically takes 24-48 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Verification Button */}
                <button
                  type="button"
                  onClick={handleVerificationSubmit}
                  disabled={verificationStatus === 'verified' || isSubmittingDocs}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                    verificationStatus === 'verified'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isSubmittingDocs
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmittingDocs
                    ? 'Submitting...'
                    : verificationStatus === 'verified'
                    ? 'Already Verified'
                    : 'Submit for Verification'}
                </button>
                
                {errors.submit && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                This screening form is designed to protect both donors and recipients. 
                If you have concerns about any question, please speak with our medical staff.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
