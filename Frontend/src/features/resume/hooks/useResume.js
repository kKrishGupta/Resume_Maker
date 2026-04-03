import { useEffect, useState } from "react";
import api from "../../../utils/api";
import {
  getResume,
  improveResume,
  saveResume,
  analyzeResume,
} from "../services/resume.api";

// =========================
// 🧾 BASE DATA
// =========================
const baseResume = {
  name: "Alex Sterling",
  email: "alex.s@alchemist.ai",
  role: "Senior Full-Stack Architect & AI Specialist",
  location: "San Francisco, CA",
  website: "portfolio.dev",
  avatar: "https://i.pravatar.cc/180?img=13",
  experience: [
    {
      title: "Lead Systems Architect",
      company: "NeuralFlow Systems",
      period: "2021 - Present",
      bullets: [
        "Spearheaded migration to microservices handling 5M+ users.",
        "Reduced cloud costs by 42% using optimized infra.",
      ],
    },
  ],
};

const baseAnalytics = {
  score: 85,
  percentile: "top 10%",
  keywords: ["Kubernetes", "GoLang", "Terraform", "AWS"],
  suggestions: [],
};

// =========================
// 🚀 HOOK
// =========================
export const useResume = (id) => {
  const [resume, setResume] = useState(baseResume);
  const [analytics, setAnalytics] = useState(baseAnalytics);

  const [lastAnalyzed, setLastAnalyzed] = useState("");

  // =========================
  // 🔥 LOAD RESUME
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getResume();
        if (data?.resume) setResume(data.resume);
      } catch (err) {
        console.log("Load resume failed", err);
      }
    };
    load();
  }, []);

  // =========================
  // 💾 AUTO SAVE
  // =========================
  useEffect(() => {
    if (!resume) return;

    const t = setTimeout(() => {
      saveResume(resume);
    }, 1000);

    return () => clearTimeout(t);
  }, [resume]);

  // =========================
  // 📊 LIVE AI ANALYSIS (OPTIMIZED)
  // =========================
  useEffect(() => {
    if (!resume) return;

    const current = JSON.stringify(resume);

    // prevent duplicate calls
    if (current === lastAnalyzed) return;

    const t = setTimeout(async () => {
      try {
        const data = await analyzeResume(resume);

        if (data?.analysis) {
          setAnalytics((prev) => ({
            ...prev,
            ...data.analysis,
          }));

          setLastAnalyzed(current);
        }
      } catch (err) {
        console.log("ATS error", err);
      }
    }, 800);

    return () => clearTimeout(t);
  }, [resume, lastAnalyzed]);

  // =========================
  // 🧠 INTERVIEW DATA (OPTIONAL)
  // =========================
  useEffect(() => {
    if (!id) return;

    const fetchInterviewData = async () => {
      try {
        const res = await api.get(`/api/interview/report/${id}`);
        const report = res?.data?.interviewReport;

        if (!report) return;

        setResume((prev) => ({
          ...prev,
          role: report.selfDescription || prev.role,
        }));

        if (report.skillGaps?.length) {
          setAnalytics((prev) => ({
            ...prev,
            keywords: report.skillGaps
              .slice(0, 4)
              .map((s) => s.skill),
          }));
        }
      } catch (err) {
        console.log("Interview fetch failed", err);
      }
    };

    fetchInterviewData();
  }, [id]);

  // =========================
  // ✨ AI IMPROVE BUTTON
  // =========================
  const handleAIImprove = async () => {
    try {
      const data = await improveResume(resume);

      if (data?.resume) {
        setResume(data.resume);
      }
    } catch (err) {
      console.log("AI improve failed", err);
    }
  };

  // =========================
  // 🎯 RETURN
  // =========================
  return {
    resume,
    setResume,
    analytics,
    handleAIImprove,
  };
};