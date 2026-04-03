export default function ResumePreviewLive({ resume, analytics }) {
  if (!resume) return null;

  return (
    <div className="resume-preview-live" id="resume-preview">

      {/* ATS BADGE */}
      <div className="ats-badge">
        {analytics?.score || 0}%
      </div>

      {/* HEADER */}
      <div className="preview-header">
        <h1>{resume.name || "Your Name"}</h1>
        <p>{resume.role || "Your Role"}</p>

        <div className="preview-contact">
          <span>{resume.email}</span>
          <span>{resume.location}</span>
        </div>
      </div>

      {/* EXPERIENCE */}
      <div className="preview-section">
        <h2>Experience</h2>

        {resume.experience?.map((job, i) => (
          <div key={i} className="preview-job">

            <div className="preview-job-top">
              <strong>{job.title}</strong>
              <span>{job.duration}</span>
            </div>

            <p className="company">{job.company}</p>

            <ul>
              {job.points?.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>

          </div>
        ))}
      </div>

    </div>
  );
}