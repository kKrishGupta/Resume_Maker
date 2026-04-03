
export default function ResumeEditor({ resume, setResume }) {

  const updateField = (field, value) => {
    setResume(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...resume.experience];
    updated[index][field] = value;

    setResume(prev => ({
      ...prev,
      experience: updated
    }));
  };

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          duration: "", // ✅ FIXED
          points: [""]  // ✅ FIXED
        }
      ]
    }));
  };

  return (
    <section className="resume-editor">

      {/* PERSONAL */}
      <div className="editor-section">
        <h2>Personal Info</h2>

        <input
          value={resume.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Your Name"
        />

        <input
          value={resume.role}
          onChange={(e) => updateField("role", e.target.value)}
          placeholder="Role"
        />

        <input
          value={resume.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Email"
        />

        <input
          value={resume.location}
          onChange={(e) => updateField("location", e.target.value)}
          placeholder="Location"
        />
      </div>

      {/* EXPERIENCE */}
      <div className="editor-section">
        <h2>Experience</h2>

        {resume.experience.map((job, index) => (
          <div key={index} className="exp-block">

            <input
              value={job.title}
              onChange={(e) =>
                updateExperience(index, "title", e.target.value)
              }
              placeholder="Job Title"
            />

            <input
              value={job.company}
              onChange={(e) =>
                updateExperience(index, "company", e.target.value)
              }
              placeholder="Company"
            />

            <input
              value={job.period}
              onChange={(e) =>
                updateExperience(index, "period", e.target.value)
              }
              placeholder="Duration"
            />

            <textarea
              value={job.bullets.join("\n")}
              onChange={(e) =>
                updateExperience(index, "bullets", e.target.value.split("\n"))
              }
              placeholder="Bullet points (one per line)"
            />

          </div>
        ))}

        <button onClick={addExperience} className="add-btn">
          ➕ Add Experience
        </button>
      </div>

      {/* AI */}
      <button className="ai-magic-btn">
        ⚡ Auto Optimize Resume
      </button>

    </section>
  );
}