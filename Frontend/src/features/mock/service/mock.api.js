import api from "../../../utils/api";

// 🎤 LIVE INTERVIEW
export const liveInterview = async (data) => {
  const res = await api.post("/interview/live", data);
  return res.data;
};

// 🏁 END INTERVIEW
export const endInterview = async (data) => {
  const res = await api.post("/interview/end", data);
  return res.data;
};

// 💬 FOLLOW-UP
export const generateFollowUp = async (data) => {
  const res = await api.post("/interview/follow-up", data);
  return res.data;
};